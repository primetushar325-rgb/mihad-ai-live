import { useState } from 'react'
import { useRouter } from 'next/router'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { Menu, Bell, LogOut, ChevronDown } from 'lucide-react'

export default function Topbar({ onMenuClick, title }) {
  const supabase = useSupabaseClient()
  const user = useUser()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const avatar = user?.user_metadata?.avatar_url
  const name = user?.user_metadata?.full_name || user?.email

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-deep-navy/80 px-5 py-4 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 lg:hidden" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="font-display text-lg font-semibold">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative rounded-lg p-2 text-slate-400 hover:bg-white/5" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-cyan" />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-3 hover:bg-white/10"
          >
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" className="h-7 w-7 rounded-lg object-cover" />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-mihad-gradient text-xs font-bold text-white">
                {name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <span className="hidden text-sm font-medium sm:inline">{name}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-navy-card p-1.5 shadow-glow">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-300 hover:bg-white/5"
              >
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
