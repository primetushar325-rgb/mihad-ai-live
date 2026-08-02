import { Radio, X, ExternalLink } from 'lucide-react'

export default function VideoCard({ video, onRemove }) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="relative aspect-video">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={video.thumbnail} alt="" className="h-full w-full object-cover" />
        {video.isLive && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
            <Radio className="h-2.5 w-2.5 animate-pulse-slow" /> LIVE
          </span>
        )}
        <button
          onClick={() => onRemove?.(video)}
          className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
          aria-label="Remove video"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-medium">{video.title}</p>
        <div className="mt-1.5 flex items-center justify-between">
          <p className="truncate text-xs text-slate-500">{video.channelTitle}</p>
          <a
            href={`https://youtube.com/watch?v=${video.videoId}`}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 text-slate-500 hover:text-cyan"
            aria-label="Open on YouTube"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  )
}
