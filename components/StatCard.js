export default function StatCard({ icon: Icon, label, value, delta, deltaPositive = true }) {
  return (
    <div className="glass-card p-5 transition-colors">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5">
          <Icon className="h-4.5 w-4.5 text-cyan" />
        </div>
        {delta && (
          <span className={`text-xs font-medium ${deltaPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {delta}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{label}</p>
    </div>
  )
}
