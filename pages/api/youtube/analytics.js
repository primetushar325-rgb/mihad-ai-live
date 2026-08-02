import { getServerSupabase } from '../../../lib/supabaseServer'
import { fetchChannelAnalytics } from '../../../lib/youtube'

// GET /api/youtube/analytics?channelId=<id>&range=7d|28d|90d|today
// Reads from analytics_cache first; falls back to a live YouTube
// Analytics API call using the connected account's OAuth access token,
// then writes the result back to the cache.
const RANGE_DAYS = { today: 1, '7d': 7, '28d': 28, '90d': 90 }

function isoDaysAgo(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const supabase = getServerSupabase(req, res)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return res.status(401).json({ error: 'Not authenticated' })

  const { channelId, range = '7d' } = req.query
  if (!channelId) return res.status(400).json({ error: 'Missing channelId' })
  const days = RANGE_DAYS[range] ?? 7

  // Serve from cache if fresh (< 15 minutes old)
  const { data: cached } = await supabase
    .from('analytics_cache')
    .select('payload, cached_at')
    .eq('user_id', session.user.id)
    .eq('channel_id', channelId)
    .eq('range_key', range)
    .maybeSingle()

  if (cached && Date.now() - new Date(cached.cached_at).getTime() < 15 * 60 * 1000) {
    return res.status(200).json({ ...cached.payload, cached: true })
  }

  // Look up the connected account's OAuth access token. In production,
  // encrypted_refresh_token is exchanged server-side for a fresh access
  // token via Google's token endpoint — never store raw access tokens.
  const { data: account } = await supabase
    .from('connected_accounts')
    .select('*')
    .eq('user_id', session.user.id)
    .eq('channel_id', channelId)
    .maybeSingle()

  if (!account) return res.status(404).json({ error: 'Channel is not connected to this account' })

  try {
    // NOTE: exchanging encrypted_refresh_token for an access token is
    // intentionally left as a TODO — wire this to your token-refresh
    // service (e.g. a Supabase Edge Function backed by Vault).
    const accessToken = req.headers['x-yt-access-token']
    if (!accessToken) {
      return res.status(501).json({
        error: 'Token exchange not configured',
        detail: 'Implement server-side refresh-token exchange, then pass the resulting access token through.',
      })
    }

    const result = await fetchChannelAnalytics({
      accessToken,
      channelId,
      startDate: isoDaysAgo(days),
      endDate: isoDaysAgo(0),
    })

    await supabase.from('analytics_cache').upsert({
      user_id: session.user.id,
      channel_id: channelId,
      range_key: range,
      payload: result,
      cached_at: new Date().toISOString(),
    })

    return res.status(200).json({ ...result, cached: false })
  } catch (err) {
    return res.status(502).json({ error: 'YouTube Analytics API request failed', detail: err.message })
  }
}
