import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import DashboardLayout from '../components/DashboardLayout'
import StatCard from '../components/StatCard'
import {
  Users, Eye, Radio, Clock, TrendingUp, Bell, Plus, Activity as ActivityIcon,
} from 'lucide-react'

export default function Dashboard() {
  const supabase = useSupabaseClient()
  const user = useUser()
  const [accounts, setAccounts] = useState([])
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let active = true

    async function load() {
      const [{ data: accs }, { data: acts }] = await Promise.all([
        supabase.from('connected_accounts').select('*').eq('user_id', user.id),
        supabase.from('activity_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(6),
      ])
      if (!active) return
      setAccounts(accs || [])
      setActivity(acts || [])
      setLoading(false)
    }
    load()
    return () => { active = false }
  }, [user, supabase])

  const totals = accounts.reduce(
    (acc, a) => ({
      subscribers: acc.subscribers + (a.subscriber_count || 0),
      views: acc.views + (a.view_count || 0),
    }),
    { subscribers: 0, views: 0 }
  )

  return (
    <DashboardLayout title="Dashboard">
      <Head><title>Dashboard — MIHAD AI.LIVE</title></Head>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Users} label="Connected Accounts" value={accounts.length} />
        <StatCard icon={Radio} label="Live Streams" value={accounts.filter((a) => a.status === 'active').length ? '—' : '0'} />
        <StatCard icon={Eye} label="Total Views" value={totals.views.toLocaleString()} />
        <StatCard icon={TrendingUp} label="Subscribers" value={totals.subscribers.toLocaleString()} />
        <StatCard icon={Clock} label="Watch Time" value="—" />
        <StatCard icon={ActivityIcon} label="Today's Growth" value="—" />
        <StatCard icon={Bell} label="Notifications" value="0" />
        <StatCard icon={Users} label="Total Channels" value={accounts.length} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="glass-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Channel overview</h2>
            <Link href="/accounts" className="text-xs font-medium text-cyan hover:underline">Manage accounts</Link>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-12 text-center">
              <p className="text-sm font-medium">No YouTube accounts connected yet</p>
              <p className="mt-1 text-xs text-slate-500">Connect up to 20 channels to see them here.</p>
              <Link href="/accounts" className="btn-primary mt-4 text-sm">
                <Plus className="h-4 w-4" /> Connect an account
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.slice(0, 6).map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.channel_thumbnail || '/avatar-placeholder.svg'} alt="" className="h-9 w-9 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.channel_title || a.channel_id}</p>
                    <p className="text-xs text-slate-500">{(a.subscriber_count ?? 0).toLocaleString()} subscribers</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card p-5">
          <h2 className="mb-4 font-semibold">Recent activity</h2>
          {activity.length === 0 ? (
            <p className="text-sm text-slate-500">Nothing yet — actions you take will show up here.</p>
          ) : (
            <ul className="space-y-3">
              {activity.map((a) => (
                <li key={a.id} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan" />
                  <div>
                    <p className="capitalize text-slate-200">{a.action.replaceAll('_', ' ')}</p>
                    <p className="text-xs text-slate-500">{new Date(a.created_at).toLocaleString()}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
