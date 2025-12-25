'use client'

import { useState, useEffect } from 'react'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts"
import { useRouter } from "next/navigation"

export function BudgetChart({ data, slug }: { data: any[], slug: string }) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return <div className="h-[300px] w-full bg-slate-50 animate-pulse rounded-xl" />

  if (!data || data.length === 0) {
    return <div className="h-[300px] flex items-center justify-center text-slate-400 italic text-sm">Zatiaľ žiadne finančné dáta.</div>
  }

  return (
    <div className="h-[300px] w-full pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}€`} />
          <Tooltip 
            cursor={{fill: '#f8fafc'}} 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px', fontWeight: 'bold' }} />
          <Bar dataKey="plan" name="Plán" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
          <Bar 
            dataKey="real" 
            name="Realita" 
            fill="#0f172a" 
            radius={[4, 4, 0, 0]} 
            style={{ cursor: 'pointer' }}
            onClick={(d) => router.push(`/${slug}/jobs/${d.id}`)}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}