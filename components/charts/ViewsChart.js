import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function ViewsChart({ data, dataKey = 'views', color = '#2E6BFF' }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.5} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ background: '#111832', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
          labelStyle={{ color: '#94a3b8' }}
        />
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill="url(#viewsFill)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
