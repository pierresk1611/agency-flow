'use client'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Cell } from "recharts"

export function BudgetChart({ data }: { data: any[] }) {
  return (
    <div className="h-[300px] w-full pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}€`} />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            cursor={{fill: '#f1f5f9'}}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
          <Bar dataKey="plan" name="Plán (Budget)" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={30} />
          <Bar dataKey="real" name="Realita (Náklad)" fill="#0f172a" radius={[4, 4, 0, 0]} barSize={30} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}