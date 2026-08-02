import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import DashboardLayout from '../components/DashboardLayout'
import {
  LogIn, Link2, Unlink, Video, Play, RefreshCw, Circle,
} from 'lucide-react'

const ICONS = {
  login: LogIn,
  account_connected: Link2,
  account_disconnected: Unlink,
  video_added: Video,
  player_started: Play,
  analytics_refreshed: RefreshCw,
}

export default function ActivityHistory() {
  const supabase = useSupabaseClient()
  const user = useUser()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!user) return
      const { data } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)
      setLogs(data || [])
      setLoading(false)
    }
    load()
  }, [user])

  return (
    <DashboardLayout title="Activity History">
      <Head><title>Activity History — MIHAD AI.LIVE</title></Head>

      <div className="glass-card overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto] gap-4 border-b border-white/10 px-5 py-3 text-xs font-medium text-slate-500">
          <span>Action</span>
          <span>Device</span>
          <span>Date &amp; time</span>
        </div>

        {loading ? (
          <p className="p-5 text-sm text-slate-500">Loading…</p>
        ) : logs.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">No activity recorded yet.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {logs.map((log) => {
              const Icon = ICONS[log.action] || Circle
              return (
                <li key={log.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-3">
                  <span className="flex items-center gap-2 text-sm">
                    <Icon className="h-4 w-4 text-cyan" />
                    <span className="capitalize">{log.action.replaceAll('_', ' ')}</span>
                  </span>
                  <span className="truncate text-xs text-slate-500">{log.detail || '—'}</span>
                  <span className="whitespace-nowrap text-xs text-slate-500">{new Date(log.created_at).toLocaleString()}</span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </DashboardLayout>
  )
}
