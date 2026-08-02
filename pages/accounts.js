import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import DashboardLayout from '../components/DashboardLayout'
import AccountCard from '../components/AccountCard'
import { Plus } from 'lucide-react'

export default function Accounts() {
  const supabase = useSupabaseClient()
  const user = useUser()
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)

  async function load() {
    if (!user) return
    const { data } = await supabase.from('connected_accounts').select('*').eq('user_id', user.id).order('connected_at', { ascending: false })
    setAccounts(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [user])

  // Connecting an additional YouTube account re-runs Google OAuth with
  // the extra readonly scopes needed for the Data/Analytics APIs. Google
  // returns to /accounts, where we read the newly granted channel from
  // the session and persist it via /api/accounts/connect.
  async function handleConnect() {
    if (accounts.length >= 20) return
    setConnecting(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/accounts`,
        scopes: 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly',
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
  }

  async function handleRefresh(account) {
    await fetch('/api/accounts/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId: account.id }),
    })
    load()
  }

  async function handleDisconnect(account) {
    if (!confirm(`Disconnect ${account.channel_title || account.channel_id}?`)) return
    await fetch('/api/accounts/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId: account.id }),
    })
    load()
  }

  function handleViewChannel(account) {
    window.open(`https://youtube.com/channel/${account.channel_id}`, '_blank')
  }

  return (
    <DashboardLayout title="Connected Accounts">
      <Head><title>Connected Accounts — MIHAD AI.LIVE</title></Head>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">
            {accounts.length} of 20 accounts connected — minimum 10 recommended for full multi-channel monitoring.
          </p>
        </div>
        <button
          onClick={handleConnect}
          disabled={connecting || accounts.length >= 20}
          className="btn-primary text-sm disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> {connecting ? 'Connecting…' : 'Connect YouTube account'}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading accounts…</p>
      ) : accounts.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-16 text-center">
          <p className="font-medium">No accounts connected</p>
          <p className="mt-1 text-sm text-slate-500">Connect your first YouTube channel with Google OAuth.</p>
          <button onClick={handleConnect} className="btn-primary mt-4 text-sm">
            <Plus className="h-4 w-4" /> Connect YouTube account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {accounts.map((a) => (
            <AccountCard
              key={a.id}
              account={a}
              onRefresh={handleRefresh}
              onDisconnect={handleDisconnect}
              onViewChannel={handleViewChannel}
              onAnalytics={() => window.location.assign(`/analytics?channel=${a.channel_id}`)}
            />
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
