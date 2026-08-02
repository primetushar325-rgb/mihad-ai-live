import Head from 'next/head'
import Link from 'next/link'
import { Radio, LayoutGrid, LineChart, ShieldCheck, ArrowRight } from 'lucide-react'

const features = [
  {
    icon: LayoutGrid,
    title: 'Multi-account command center',
    desc: 'Connect 10–20 YouTube channels via Google OAuth and see subscribers, views, and live status in one place.',
  },
  {
    icon: Radio,
    title: 'Multi live monitor',
    desc: 'Paste up to 20 video or live URLs and watch real, official YouTube embeds side by side — 1 to 20 at a time.',
  },
  {
    icon: LineChart,
    title: 'Real analytics, not vanity numbers',
    desc: 'Growth charts and view/watch-time trends pulled straight from the YouTube Analytics API you authorize.',
  },
  {
    icon: ShieldCheck,
    title: 'Built to respect the platform',
    desc: 'No autoplay tricks, no hidden players, no artificial engagement. Every number on screen is a real YouTube number.',
  },
]

export default function Home() {
  return (
    <>
      <Head>
        <title>MIHAD AI.LIVE — Multi-Channel YouTube Live Monitor &amp; Analytics</title>
      </Head>
      <main className="min-h-screen overflow-hidden">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-mihad-gradient">
              <Radio className="h-4 w-4 text-white" />
            </div>
            <span className="font-display font-bold">MIHAD AI.LIVE</span>
          </div>
          <Link href="/login" className="btn-secondary text-sm">Sign in</Link>
        </nav>

        <section className="mx-auto max-w-4xl px-6 pb-20 pt-16 text-center">
          <span className="mb-6 inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-cyan">
            Multi-Channel YouTube Live Monitor &amp; Analytics Dashboard
          </span>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            Watch every channel.
            <br />
            <span className="gradient-text">Trust every number.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
            MIHAD AI.LIVE brings your connected YouTube channels, live streams, and
            real analytics into a single, fast, mobile-first dashboard — with nothing
            faked and nothing hidden.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/login" className="btn-primary">
              Continue with Google <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl grid-cols-1 gap-5 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="glass-card p-6">
              <f.icon className="mb-4 h-6 w-6 text-cyan" />
              <h3 className="mb-2 font-semibold">{f.title}</h3>
              <p className="text-sm text-slate-400">{f.desc}</p>
            </div>
          ))}
        </section>

        <footer className="border-t border-white/10 py-8 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} MIHAD AI.LIVE. Public YouTube data only — no manipulation, ever.
        </footer>
      </main>
    </>
  )
}
