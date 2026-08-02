import { getServerSupabase } from '../../../lib/supabaseServer'
import { extractVideoId, fetchVideoMetadata } from '../../../lib/youtube'

// GET /api/youtube/video?url=<youtube url or id>
// Returns public metadata only (title, thumbnail, channel, live status,
// public view/like counts). Requires an authenticated session so the
// endpoint can't be used as an open scraping proxy.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const supabase = getServerSupabase(req, res)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return res.status(401).json({ error: 'Not authenticated' })

  const { url } = req.query
  const videoId = extractVideoId(Array.isArray(url) ? url[0] : url)
  if (!videoId) return res.status(400).json({ error: 'Could not parse a video ID from that URL' })

  try {
    const metadata = await fetchVideoMetadata(videoId)
    if (!metadata) return res.status(404).json({ error: 'Video not found' })
    return res.status(200).json(metadata)
  } catch (err) {
    return res.status(502).json({ error: 'YouTube API request failed', detail: err.message })
  }
}
