'use client'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const COLORS = { TODO: '#f43f5e', IN_PROGRESS: '#3b82f6', DONE: '#10b981' }

export function JobStatusChart({ data }: { data: any[] }) {
  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
            {data.map((entry: any) => <Cell key={entry.name} fill={COLORS[entry.name as keyof typeof COLORS]} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}