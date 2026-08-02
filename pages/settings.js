import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import DashboardLayout from '../components/DashboardLayout'
import { Smartphone, Monitor, LogOut } from 'lucide-react'

export default function Settings() {
  const supabase = useSupabaseClient()
  const user = useUser()
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    async function load() {
      if (!user) return
      const { data } = await supabase.from('device_sessions').select('*').eq('user_id', user.id).order('last_active_at', { ascending: false })
      setSessions(data || [])
    }
    load()
  }, [user])

  async function handleSignOutEverywhere() {
    await supabase.auth.signOut({ scope: 'global' })
    window.location.href = '/login'
  }

  return (
    <DashboardLayout title="Settings">
      <Head><title>Settings — MIHAD AI.LIVE</title></Head>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="glass-card p-5">
          <h2 className="mb-4 font-semibold">Account</h2>
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={user?.user_metadata?.avatar_url} alt="" className="h-12 w-12 rounded-xl object-cover" />
            <div>
              <p className="font-medium">{user?.user_metadata?.full_name}</p>
              <p className="text-sm text-slate-500">{user?.email}</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Signed in with Google. Password sign-in is never available — your credentials
            are managed entirely by Google.
          </p>
        </div>

        <div className="glass-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Active devices</h2>
            <button onClick={handleSignOutEverywhere} className="btn-danger text-xs">
              <LogOut className="h-3.5 w-3.5" /> Sign out everywhere
            </button>
          </div>
          {sessions.length === 0 ? (
            <p className="text-sm text-slate-500">This device is your only active session.</p>
          ) : (
            <ul className="space-y-3">
              {sessions.map((s) => (
                <li key={s.id} className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
                  {/(mobile|android|iphone)/i.test(s.user_agent || '') ? (
                    <Smartphone className="h-4 w-4 text-cyan" />
                  ) : (
                    <Monitor className="h-4 w-4 text-cyan" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{s.device_label || 'Unknown device'}</p>
                    <p className="text-xs text-slate-500">Last active {new Date(s.last_active_at).toLocaleString()}</p>
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
