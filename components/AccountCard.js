import { Eye, RefreshCw, Unlink, BarChart3 } from 'lucide-react'

const statusStyles = {
  active: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30',
  error: 'bg-amber-400/10 text-amber-300 border-amber-400/30',
  revoked: 'bg-red-400/10 text-red-300 border-red-400/30',
}

export default function AccountCard({ account, onRefresh, onDisconnect, onViewChannel, onAnalytics }) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={account.channel_thumbnail || '/avatar-placeholder.svg'}
          alt=""
          className="h-12 w-12 rounded-xl object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{account.channel_title || 'Untitled channel'}</p>
          <p className="truncate text-xs text-slate-500">{account.channel_id}</p>
          <span className={`mt-1.5 inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${statusStyles[account.status] || statusStyles.active}`}>
            {account.status}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-white/5 py-2">
          <p className="text-sm font-semibold">{account.subscriber_count ?? '—'}</p>
          <p className="text-[10px] text-slate-500">Subscribers</p>
        </div>
        <div className="rounded-lg bg-white/5 py-2">
          <p className="text-sm font-semibold">{account.view_count ?? '—'}</p>
          <p className="text-[10px] text-slate-500">Total views</p>
        </div>
        <div className="rounded-lg bg-white/5 py-2">
          <p className="text-sm font-semibold">{account.video_count ?? '—'}</p>
          <p className="text-[10px] text-slate-500">Videos</p>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-slate-500">
        Last synced: {account.last_synced_at ? new Date(account.last_synced_at).toLocaleString() : 'never'}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button onClick={() => onViewChannel?.(account)} className="btn-secondary py-2 text-xs">
          <Eye className="h-3.5 w-3.5" /> View
        </button>
        <button onClick={() => onAnalytics?.(account)} className="btn-secondary py-2 text-xs">
          <BarChart3 className="h-3.5 w-3.5" /> Analytics
        </button>
        <button onClick={() => onRefresh?.(account)} className="btn-secondary py-2 text-xs">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
        <button onClick={() => onDisconnect?.(account)} className="btn-danger py-2 text-xs">
          <Unlink className="h-3.5 w-3.5" /> Disconnect
        </button>
      </div>
    </div>
  )
}
