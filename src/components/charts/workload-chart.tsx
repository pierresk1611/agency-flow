'use client'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { useRouter } from "next/navigation"

const COLORS = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

export function WorkloadChart({ data, slug }: { data: any[], slug: string }) {
  const router = useRouter()
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
            onClick={() => router.push(`/${slug}/agency`)} // Smeruje do tímu na presun úloh
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px' }}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}