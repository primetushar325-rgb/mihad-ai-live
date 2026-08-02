import { getServerSupabase } from '../../../lib/supabaseServer'
import { fetchChannelStats } from '../../../lib/youtube'

// POST /api/accounts/refresh
// Body: { accountId }
// Re-fetches public stats for a single connected account.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const supabase = getServerSupabase(req, res)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return res.status(401).json({ error: 'Not authenticated' })

  const { accountId } = req.body || {}
  if (!accountId) return res.status(400).json({ error: 'Missing accountId' })

  const { data: account, error: fetchError } = await supabase
    .from('connected_accounts')
    .select('*')
    .eq('id', accountId)
    .eq('user_id', session.user.id)
    .maybeSingle()

  if (fetchError || !account) return res.status(404).json({ error: 'Account not found' })

  try {
    const stats = await fetchChannelStats(account.channel_id)
    const { data, error } = await supabase
      .from('connected_accounts')
      .update({
        channel_title: stats?.title ?? account.channel_title,
        channel_thumbnail: stats?.thumbnail ?? account.channel_thumbnail,
        status: 'active',
        last_synced_at: new Date().toISOString(),
      })
      .eq('id', accountId)
      .select()
      .single()

    if (error) return res.status(400).json({ error: error.message })

    await supabase.from('youtube_channels').insert({
      connected_account_id: accountId,
      user_id: session.user.id,
      channel_id: account.channel_id,
      subscriber_count: stats?.subscriberCount,
      view_count: stats?.viewCount,
      video_count: stats?.videoCount,
    })

    await supabase.from('activity_logs').insert({
      user_id: session.user.id,
      action: 'analytics_refreshed',
      detail: stats?.title || account.channel_id,
    })

    return res.status(200).json({ ...data, subscriber_count: stats?.subscriberCount, view_count: stats?.viewCount, video_count: stats?.videoCount })
  } catch (err) {
    await supabase.from('connected_accounts').update({ status: 'error' }).eq('id', accountId)
    return res.status(502).json({ error: 'Failed to refresh channel stats', detail: err.message })
  }
}
