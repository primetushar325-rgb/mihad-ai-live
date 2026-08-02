import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import DashboardLayout from '../components/DashboardLayout'
import ViewsChart from '../components/charts/ViewsChart'
import SubscriberChart from '../components/charts/SubscriberChart'
import { RefreshCw } from 'lucide-react'

const RANGES = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7 days' },
  { key: '28d', label: '28 days' },
  { key: '90d', label: '90 days' },
  { key: 'custom', label: 'Custom' },
]

export default function Analytics() {
  const supabase = useSupabaseClient()
  const user = useUser()
  const router = useRouter()
  const [accounts, setAccounts] = useState([])
  const [selected, setSelected] = useState(router.query.channel || '')
  const [range, setRange] = useState('7d')
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    async function load() {
      if (!user) return
      const { data } = await supabase.from('connected_accounts').select('*').eq('user_id', user.id)
      setAccounts(data || [])
      if (!selected && data?.[0]) setSelected(data[0].channel_id)
    }
    load()
  }, [user])

  async function handleRefresh() {
    if (!selected) return
    setLoading(true)
    setNotice(null)
    try {
      const res = await fetch(`/api/youtube/analytics?channelId=${selected}&range=${range}`)
      const data = await res.json()
      if (!res.ok) {
        setNotice(data.detail || data.error || 'Could not load analytics for this range.')
      }
    } finally {
      setLoading(false)
    }
  }

  const account = accounts.find((a) => a.channel_id === selected)

  // Placeholder shape for the chart components until a live Analytics
  // API response (via /api/youtube/analytics) is wired to an access token.
  const viewsData = [
    { label: 'Mon', views: 0 }, { label: 'Tue', views: 0 }, { label: 'Wed', views: 0 },
    { label: 'Thu', views: 0 }, { label: 'Fri', views: 0 }, { label: 'Sat', views: 0 }, { label: 'Sun', views: 0 },
  ]
  const subsData = [
    { label: 'Mon', value: 0 }, { label: 'Tue', value: 0 }, { label: 'Wed', value: 0 },
    { label: 'Thu', value: 0 }, { label: 'Fri', value: 0 }, { label: 'Sat', value: 0 }, { label: 'Sun', value: 0 },
  ]

  return (
    <DashboardLayout title="Analytics Dashboard">
      <Head><title>Analytics — MIHAD AI.LIVE</title></Head>

      <div className="glass-card mb-6 flex flex-wrap items-center justify-between gap-3 p-4">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
        >
          <option value="" disabled>Select a channel</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.channel_id}>{a.channel_title || a.channel_id}</option>
          ))}
        </select>

        <div className="flex flex-wrap items-center gap-2">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${range === r.key ? 'bg-mihad-gradient text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
            >
              {r.label}
            </button>
          ))}
          <button onClick={handleRefresh} disabled={loading || !selected} className="btn-secondary text-xs disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {notice && (
        <div className="mb-6 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-300">
          {notice}
        </div>
      )}

      {!selected ? (
        <div className="glass-card flex flex-col items-center justify-center py-16 text-center">
          <p className="font-medium">No channel selected</p>
          <p className="mt-1 text-sm text-slate-500">Connect an account to view its analytics.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="glass-card p-5">
            <h2 className="mb-4 font-semibold">Views over time</h2>
            <ViewsChart data={viewsData} />
          </div>
          <div className="glass-card p-5">
            <h2 className="mb-4 font-semibold">Subscriber growth</h2>
            <SubscriberChart data={subsData} />
          </div>
          <div className="glass-card p-5">
            <h2 className="mb-4 font-semibold">Video comparison</h2>
            <p className="text-sm text-slate-500">Add videos in Multi Live Monitor to compare their public performance here.</p>
          </div>
          <div className="glass-card p-5">
            <h2 className="mb-4 font-semibold">Live viewer history</h2>
            <p className="text-sm text-slate-500">Live concurrent-viewer history appears here while a stream authorized by {account?.channel_title || 'this channel'} is active.</p>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
