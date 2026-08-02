import { useMemo } from 'react'

const GRID_COLS = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  4: 'grid-cols-1 sm:grid-cols-2',
  6: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  9: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  12: 'grid-cols-2 lg:grid-cols-4',
  16: 'grid-cols-2 lg:grid-cols-4',
  20: 'grid-cols-2 lg:grid-cols-5',
}

// Renders official YouTube iframe embeds only. Playback state (play/pause/
// mute) is driven entirely by the YouTube IFrame Player API in response to
// explicit user clicks on the master controls — nothing autoplays and
// nothing simulates a view.
export default function PlayerGrid({ videos, layout, playerRefs, muted }) {
  const visible = useMemo(() => videos.slice(0, Number(layout)), [videos, layout])
  const cols = GRID_COLS[layout] || GRID_COLS[4]

  if (visible.length === 0) {
    return (
      <div className="glass-card flex h-64 flex-col items-center justify-center text-center">
        <p className="text-sm font-medium">No videos in this layout yet</p>
        <p className="mt-1 text-xs text-slate-500">Add videos from Multi Live Monitor first.</p>
      </div>
    )
  }

  return (
    <div className={`grid gap-4 ${cols}`}>
      {visible.map((video, i) => (
        <div key={video.videoId} className="glass-card overflow-hidden">
          <div className="aspect-video">
            <iframe
              ref={(el) => { if (playerRefs) playerRefs.current[i] = el }}
              id={`player-${video.videoId}`}
              className="h-full w-full"
              src={`https://www.youtube.com/embed/${video.videoId}?enablejsapi=1&mute=${muted ? 1 : 0}`}
              title={video.title}
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <p className="truncate p-2 text-xs text-slate-400">{video.title}</p>
        </div>
      ))}
    </div>
  )
}
