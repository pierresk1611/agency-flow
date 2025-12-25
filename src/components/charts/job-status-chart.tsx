'use client'
import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const COLORS = { TODO: '#f43f5e', IN_PROGRESS: '#3b82f6', DONE: '#10b981', VYHRANÉ: '#10b981' }

export function JobStatusChart({ data }: { data: any[] }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return <div className="h-[200px] w-full bg-slate-50 animate-pulse rounded-full mx-auto max-w-[200px]" />

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
            {data.map((entry: any) => (
                <Cell key={entry.name} fill={COLORS[entry.name as keyof typeof COLORS] || '#cbd5e1'} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: '10px', border: 'none' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}