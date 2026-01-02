'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import { useRouter } from "next/navigation"

const COLORS = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

export function WorkloadChart({ data, slug }: { data: any[], slug: string }) {
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return <div className="h-[300px] bg-slate-50 animate-pulse rounded-lg" />

  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground italic text-sm border-2 border-dashed rounded-lg">
        Tím nemá priradenú prácu.
      </div>
    )
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            fontSize={11}
            fontWeight={600}
            interval={0}
            height={40}
          />
          <YAxis axisLine={false} tickLine={false} fontSize={11} />
          <Tooltip
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
          <Bar
            dataKey="value"
            name="Naplánované hodiny"
            fill="#3b82f6"
            radius={[6, 6, 0, 0]}
            barSize={40}
            onClick={() => router.push(`/${slug}/agency`)}
            style={{ cursor: 'pointer' }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}