'use client'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export function PersonalTimeChart({ data }: { data: any[] }) {
  return (
    <div className="h-[250px] w-full pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="name" fontSize={10} hide />
          <YAxis fontSize={10} axisLine={false} tickLine={false} />
          <Tooltip />
          <Area type="monotone" dataKey="minutes" name="Minúty" stroke="#6366f1" fillOpacity={1} fill="url(#colorTime)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}