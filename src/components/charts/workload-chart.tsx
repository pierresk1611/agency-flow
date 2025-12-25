'use client'

import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
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
        <PieChart>
          <Pie
            data={data}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            style={{ cursor: 'pointer' }}
            onClick={() => router.push(`/${slug}/agency`)}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}