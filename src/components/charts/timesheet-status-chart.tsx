'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export function TimesheetStatusChart({ data }: { data: any[] }) {
  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: -20 }}>
          <XAxis type="number" hide />
          <YAxis dataKey="name" type="category" fontSize={10} width={80} />
          <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '10px' }} />
          <Legend iconType="circle" />
          <Bar dataKey="approved" name="Schválené" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
          <Bar dataKey="pending" name="Na schválenie" stackId="a" fill="#f59e0b" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}