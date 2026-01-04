'use client'
import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts'

const COLORS = { TODO: '#f43f5e', IN_PROGRESS: '#3b82f6', DONE: '#10b981', VYHRANÉ: '#10b981' }

export function JobStatusChart({ data }: { data: any[] }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return <div className="h-[200px] w-full bg-slate-50 animate-pulse rounded" />

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ borderRadius: '10px', border: 'none' }} />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {data.map((entry: any) => (
              <Cell key={entry.name} fill={COLORS[entry.name as keyof typeof COLORS] || '#cbd5e1'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}