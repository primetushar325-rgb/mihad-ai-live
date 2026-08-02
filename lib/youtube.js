// Server-side helpers for the YouTube Data API v3 and YouTube Analytics API.
// The API key and OAuth client secret NEVER leave the server — these
// functions are only ever called from pages/api/* routes.
//
// This module only reads PUBLIC metadata (title, thumbnail, live status,
// public stats) via the Data API, and reads an authorized user's OWN
// channel analytics via the Analytics API after they grant consent
// through Google OAuth. It does not simulate views, watch time, or
// engagement of any kind.

const YT_DATA_BASE = 'https://www.googleapis.com/youtube/v3'
const YT_ANALYTICS_BASE = 'https://youtubeanalytics.googleapis.com/v2'

function requireApiKey() {
  const key = process.env.YOUTUBE_API_KEY
  if (!key) throw new Error('YOUTUBE_API_KEY is not configured on the server')
  return key
}

// Extract a video ID from a full YouTube URL or a bare ID.
export function extractVideoId(input) {
  if (!input) return null
  const trimmed = input.trim()
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed
  try {
    const url = new URL(trimmed)
    if (url.hostname.includes('youtu.be')) return url.pathname.slice(1)
    if (url.searchParams.get('v')) return url.searchParams.get('v')
    const liveMatch = url.pathname.match(/\/live\/([a-zA-Z0-9_-]{11})/)
    if (liveMatch) return liveMatch[1]
  } catch {
    return null
  }
  return null
}

// Public video metadata: title, thumbnail, channel, live status, stats.
export async function fetchVideoMetadata(videoId) {
  const key = requireApiKey()
  const url = `${YT_DATA_BASE}/videos?part=snippet,liveStreamingDetails,statistics&id=${videoId}&key=${key}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`YouTube Data API error: ${res.status}`)
  const data = await res.json()
  const item = data.items?.[0]
  if (!item) return null

  return {
    videoId,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
    channelTitle: item.snippet.channelTitle,
    channelId: item.snippet.channelId,
    isLive: item.snippet.liveBroadcastContent === 'live',
    concurrentViewers: item.liveStreamingDetails?.concurrentViewers || null,
    viewCount: item.statistics?.viewCount || null,
    likeCount: item.statistics?.likeCount || null,
  }
}

// Public channel statistics.
export async function fetchChannelStats(channelId) {
  const key = requireApiKey()
  const url = `${YT_DATA_BASE}/channels?part=snippet,statistics&id=${channelId}&key=${key}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`YouTube Data API error: ${res.status}`)
  const data = await res.json()
  const item = data.items?.[0]
  if (!item) return null

  return {
    channelId,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
    subscriberCount: item.statistics?.hiddenSubscriberCount ? null : Number(item.statistics.subscriberCount),
    viewCount: Number(item.statistics.viewCount || 0),
    videoCount: Number(item.statistics.videoCount || 0),
  }
}

// Authorized channel analytics (requires the connected account's OAuth
// access token — never the server's own API key).
export async function fetchChannelAnalytics({ accessToken, channelId, startDate, endDate, metrics }) {
  const params = new URLSearchParams({
    ids: `channel==${channelId}`,
    startDate,
    endDate,
    metrics: metrics || 'views,estimatedMinutesWatched,subscribersGained,subscribersLost',
    dimensions: 'day',
  })

  const res = await fetch(`${YT_ANALYTICS_BASE}/reports?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`YouTube Analytics API error: ${res.status}`)
  return res.json()
}
