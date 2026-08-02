import { getServerSupabase } from '../../../lib/supabaseServer'
import { fetchChannelStats } from '../../../lib/youtube'

// POST /api/accounts/connect
// Body: { channelId }
// Records a newly authorized YouTube channel. The actual Google OAuth
// consent flow happens client-side (Supabase Auth with the youtube.readonly
// / yt-analytics.readonly scopes); this endpoint just persists the result
// and pulls initial public stats. The 20-account cap is enforced by a
// database trigger (see supabase/schema.sql) as well as here.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const supabase = getServerSupabase(req, res)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return res.status(401).json({ error: 'Not authenticated' })

  const { channelId, googleAccountEmail } = req.body || {}
  if (!channelId) return res.status(400).json({ error: 'Missing channelId' })

  const { count } = await supabase
    .from('connected_accounts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', session.user.id)

  if ((count ?? 0) >= 20) {
    return res.status(409).json({ error: 'Maximum of 20 connected YouTube accounts reached' })
  }

  let stats = null
  try {
    stats = await fetchChannelStats(channelId)
  } catch {
    // Non-fatal: the account can still be saved and synced later.
  }

  const { data, error } = await supabase
    .from('connected_accounts')
    .insert({
      user_id: session.user.id,
      channel_id: channelId,
      channel_title: stats?.title,
      channel_thumbnail: stats?.thumbnail,
      google_account_email: googleAccountEmail,
      status: 'active',
      last_synced_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })

  await supabase.from('activity_logs').insert({
    user_id: session.user.id,
    action: 'account_connected',
    detail: stats?.title || channelId,
  })

  return res.status(201).json(data)
}
