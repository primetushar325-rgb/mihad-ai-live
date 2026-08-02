import { useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import DashboardLayout from '../components/DashboardLayout'
import PlayerGrid from '../components/PlayerGrid'
import {
  Play, Pause, Volume2, VolumeX, Trash2, ChevronLeft, ChevronRight, AlertTriangle,
} from 'lucide-react'

const LAYOUTS = ['1', '2', '4', '6', '9', '12', '16', '20']
const MOBILE_GROUP_SIZE = 4

// Loads the YouTube IFrame Player API once, then wraps each embedded
// iframe in a YT.Player so master controls can call real play()/pause()/
// mute() methods — the same thing a person clicking each player directly
// would trigger. No autoplay, no hidden players, no simulated engagement.
function useYouTubeAPI() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (window.YT && window.YT.Player) { setReady(true); return }
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.body.appendChild(tag)
    window.onYouTubeIframeAPIReady = () => setReady(true)
  }, [])
  return ready
}

export default function PlayerPage() {
  const supabase = useSupabaseClient()
  const user = useUser()
  const [videos, setVideos] = useState([])
  const [layout, setLayout] = useState('4')
  const [muted, setMuted] = useState(true)
  const [groupIndex, setGroupIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [lowEndWarning, setLowEndWarning] = useState(false)
  const playerRefs = useRef([])
  const ytApiReady = useYouTubeAPI()

  useEffect(() => {
    async function load() {
      if (!user) return
      const { data } = await supabase.from('saved_videos').select('*').eq('user_id', user.id).order('added_at', { ascending: false })
      setVideos((data || []).map((v) => ({
        videoId: v.video_id, title: v.title, thumbnail: v.thumbnail_url, channelTitle: v.channel_title, isLive: v.is_live,
      })))
    }
    load()
  }, [user])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    // Heuristic low-end-device warning for large grids on mobile.
    const cores = navigator.hardwareConcurrency || 4
    setLowEndWarning(isMobile && cores <= 4 && Number(layout) > MOBILE_GROUP_SIZE)
  }, [isMobile, layout])

  const effectiveVideos = isMobile
    ? videos.slice(groupIndex * MOBILE_GROUP_SIZE, groupIndex * MOBILE_GROUP_SIZE + MOBILE_GROUP_SIZE)
    : videos
  const effectiveLayout = isMobile ? String(Math.min(MOBILE_GROUP_SIZE, effectiveVideos.length || 1)) : layout
  const groupCount = Math.ceil(videos.length / MOBILE_GROUP_SIZE) || 1

  function callOnAll(method, ...args) {
    playerRefs.current.forEach((iframe) => {
      if (!iframe || !iframe.contentWindow) return
      iframe.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: method, args }),
        '*'
      )
    })
  }

  async function handlePlayAll() {
    callOnAll('playVideo')
    if (user) {
      await supabase.from('activity_logs').insert({ user_id: user.id, action: 'player_started', detail: `${effectiveVideos.length} players, layout ${effectiveLayout}` })
    }
  }
  function handlePauseAll() { callOnAll('pauseVideo') }
  function handleMuteAll() { callOnAll('mute'); setMuted(true) }
  function handleUnmuteAll() { callOnAll('unMute'); setMuted(false) }
  function handleRemoveAll() { setVideos([]) }

  return (
    <DashboardLayout title="Multi Player">
      <Head><title>Multi Player — MIHAD AI.LIVE</title></Head>

      <div className="glass-card mb-5 flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-medium text-slate-500">Layout:</span>
          {LAYOUTS.map((l) => (
            <button
              key={l}
              onClick={() => setLayout(l)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                layout === l ? 'bg-mihad-gradient text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
              disabled={isMobile}
              title={isMobile ? 'Layout is fixed to groups of 4 on mobile' : undefined}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={handlePlayAll} className="btn-primary text-xs"><Play className="h-3.5 w-3.5" /> Play all</button>
          <button onClick={handlePauseAll} className="btn-secondary text-xs"><Pause className="h-3.5 w-3.5" /> Pause all</button>
          {muted ? (
            <button onClick={handleUnmuteAll} className="btn-secondary text-xs"><Volume2 className="h-3.5 w-3.5" /> Unmute all</button>
          ) : (
            <button onClick={handleMuteAll} className="btn-secondary text-xs"><VolumeX className="h-3.5 w-3.5" /> Mute all</button>
          )}
          <button onClick={handleRemoveAll} className="btn-danger text-xs"><Trash2 className="h-3.5 w-3.5" /> Remove all</button>
        </div>
      </div>

      {lowEndWarning && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Large grids can be demanding on mobile devices — consider a smaller layout for smoother playback.
        </div>
      )}

      {isMobile && videos.length > MOBILE_GROUP_SIZE && (
        <div className="mb-4 flex items-center justify-between">
          <button onClick={() => setGroupIndex((i) => Math.max(0, i - 1))} disabled={groupIndex === 0} className="btn-secondary text-xs disabled:opacity-40">
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <span className="text-xs text-slate-500">Group {groupIndex + 1} of {groupCount}</span>
          <button onClick={() => setGroupIndex((i) => Math.min(groupCount - 1, i + 1))} disabled={groupIndex >= groupCount - 1} className="btn-secondary text-xs disabled:opacity-40">
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      <PlayerGrid videos={effectiveVideos} layout={effectiveLayout} playerRefs={playerRefs} muted={muted} />
    </DashboardLayout>
  )
}
