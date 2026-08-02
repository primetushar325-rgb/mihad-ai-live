import { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { useEffect } from 'react'
import GoogleButton from '../components/GoogleButton'
import { Radio, ShieldCheck, Gauge } from 'lucide-react'

export default function Login() {
  const supabase = useSupabaseClient()
  const user = useUser()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user) router.replace('/dashboard')
  }, [user, router])

  async function handleGoogleLogin() {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
        // Incremental scopes for YouTube Data/Analytics are requested
        // separately when the user connects a channel, not at login.
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>MIHAD AI.LIVE — Sign in</title>
      </Head>
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-mihad-gradient shadow-glow">
              <Radio className="h-7 w-7 text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              MIHAD <span className="gradient-text">AI.LIVE</span>
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Multi-Channel YouTube Live Monitor &amp; Analytics Dashboard
            </p>
          </div>

          <div className="glass-card p-8">
            <h2 className="mb-1 text-lg font-semibold">Sign in to your dashboard</h2>
            <p className="mb-6 text-sm text-slate-400">
              Use your Google account. We never see or store your password —
              it's entered only on Google's own sign-in page.
            </p>

            <GoogleButton onClick={handleGoogleLogin} loading={loading} />

            {error && (
              <p className="mt-4 text-sm text-red-300" role="alert">{error}</p>
            )}

            <div className="mt-6 flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-400">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
              <span>
                Authentication is handled entirely by Google OAuth via Supabase Auth.
                Your same Google account works across phone, tablet, and desktop.
              </span>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><Gauge className="h-3.5 w-3.5" /> Real-time public stats</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> No manipulation, ever</span>
          </div>
        </div>
      </main>
    </>
  )
}
