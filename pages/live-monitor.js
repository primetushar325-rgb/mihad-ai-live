import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import DashboardLayout from '../components/DashboardLayout'
import VideoCard from '../components/VideoCard'
import { Plus, Link2 } from 'lucide-react'

export default function LiveMonitor() {
  const supabase = useSupabaseClient()
  const user = useUser()
  const [videos, setVideos] = useState([])
  const [urlInput, setUrlInput] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      if (!user) return
      const { data } = await supabase.from('saved_videos').select('*').eq('user_id', user.id).order('added_at', { ascending: false })
      setVideos((data || []).map((v) => ({
        videoId: v.video_id,
        title: v.title,
        thumbnail: v.thumbnail_url,
        channelTitle: v.channel_title,
        isLive: v.is_live,
        rowId: v.id,
      })))
    }
    load()
  }, [user])

  async function handleAdd(e) {
    e.preventDefault()
    setError(null)
    if (!urlInput.trim()) return
    if (videos.length >= 20) {
      setError('You can monitor up to 20 videos at once.')
      return
    }

    setAdding(true)
    try {
      const res = await fetch(`/api/youtube/video?url=${encodeURIComponent(urlInput.trim())}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not look up that video')

      const { data: inserted, error: insertError } = await supabase
        .from('saved_videos')
        .insert({
          user_id: user.id,
          video_id: data.videoId,
          title: data.title,
          thumbnail_url: data.thumbnail,
          channel_title: data.channelTitle,
          is_live: data.isLive,
        })
        .select()
        .single()

      if (insertError) throw new Error(insertError.message)

      setVideos((prev) => [{ ...data, rowId: inserted.id }, ...prev])
      setUrlInput('')

      await supabase.from('activity_logs').insert({ user_id: user.id, action: 'video_added', detail: data.title })
    } catch (err) {
      setError(err.message)
    } finally {
      setAdding(false)
    }
  }

  async function handleRemove(video) {
    await supabase.from('saved_videos').delete().eq('id', video.rowId)
    setVideos((prev) => prev.filter((v) => v.videoId !== video.videoId))
  }

  return (
    <DashboardLayout title="Multi Live Monitor">
      <Head><title>Multi Live Monitor — MIHAD AI.LIVE</title></Head>

      <div className="glass-card mb-6 p-5">
        <h2 className="mb-1 font-semibold">Add a video or live stream</h2>
        <p className="mb-4 text-sm text-slate-400">
          Paste any YouTube video or live URL. We'll pull the public title, thumbnail, channel, and live status.
        </p>
        <form onSubmit={handleAdd} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://youtube.com/watch?v=… or a live URL"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-sm outline-none focus-visible:border-electric-blue"
            />
          </div>
          <button type="submit" disabled={adding} className="btn-primary text-sm disabled:opacity-60">
            <Plus className="h-4 w-4" /> {adding ? 'Adding…' : 'Add video'}
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
        <p className="mt-2 text-xs text-slate-500">{videos.length} / 20 videos added</p>
      </div>

      {videos.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-16 text-center">
          <p className="font-medium">No videos yet</p>
          <p className="mt-1 text-sm text-slate-500">Add a URL above to start monitoring.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {videos.map((v) => (
            <VideoCard key={v.videoId} video={v} onRemove={handleRemove} />
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
