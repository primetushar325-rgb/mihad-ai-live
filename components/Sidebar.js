import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  LayoutDashboard, Users, Radio, Grid3x3, LineChart, History, Settings, X,
} from 'lucide-react'

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/accounts', label: 'Connected Accounts', icon: Users },
  { href: '/live-monitor', label: 'Multi Live Monitor', icon: Radio },
  { href: '/player', label: 'Multi Player', icon: Grid3x3 },
  { href: '/analytics', label: 'Analytics', icon: LineChart },
  { href: '/activity', label: 'Activity History', icon: History },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ open, onClose }) {
  const router = useRouter()

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 -translate-x-full border-r border-white/10 bg-navy-surface/95 p-5 backdrop-blur-xl transition-transform duration-200 lg:static lg:translate-x-0 ${open ? 'translate-x-0' : ''}`}
      >
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-mihad-gradient">
              <Radio className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-sm font-bold">MIHAD AI.LIVE</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 lg:hidden" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1">
          {links.map((link) => {
            const active = router.pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={active ? 'sidebar-link-active' : 'sidebar-link'}
                onClick={onClose}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
