import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useUser } from '@supabase/auth-helpers-react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function DashboardLayout({ title, children }) {
  const user = useUser()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Client-side guard as a second layer behind the edge middleware.
  useEffect(() => {
    if (user === null) router.replace('/login')
  }, [user, router])

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-electric-blue border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-5 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
