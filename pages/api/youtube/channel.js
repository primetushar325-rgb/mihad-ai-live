import { getServerSupabase } from '../../../lib/supabaseServer'
import { fetchChannelStats } from '../../../lib/youtube'

// GET /api/youtube/channel?id=<channelId>
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const supabase = getServerSupabase(req, res)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return res.status(401).json({ error: 'Not authenticated' })

  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'Missing channel id' })

  try {
    const stats = await fetchChannelStats(Array.isArray(id) ? id[0] : id)
    if (!stats) return res.status(404).json({ error: 'Channel not found' })
    return res.status(200).json(stats)
  } catch (err) {
    return res.status(502).json({ error: 'YouTube API request failed', detail: err.message })
  }
}
