import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'

const COLORS = ['#2E6BFF', '#8B5CF6', '#33E6FF', '#2E6BFF', '#8B5CF6', '#33E6FF']

export default function SubscriberChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ background: '#111832', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
          labelStyle={{ color: '#94a3b8' }}
          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
