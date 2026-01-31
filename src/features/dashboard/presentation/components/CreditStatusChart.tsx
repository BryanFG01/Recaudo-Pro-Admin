import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

interface CreditStatusChartProps {
  upToDatePercentage: number
  overduePercentage: number
  activeCredits: number
  clientsInArrears: number
}

export default function CreditStatusChart({
  upToDatePercentage,
  overduePercentage,
  activeCredits,
  clientsInArrears
}: CreditStatusChartProps) {
  const data = [
    { name: 'Al Día', value: upToDatePercentage, count: activeCredits - clientsInArrears },
    { name: 'Atrasados', value: overduePercentage, count: clientsInArrears }
  ]

  const COLORS = ['#10b981', '#ef4444']

  return (
    <div className="bg-[#0f171a] border border-gray-600 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4 text-white">Estado de Créditos</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #4b5563',
              borderRadius: '6px'
            }}
          />
          <Legend wrapperStyle={{ color: '#e5e7eb' }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Al Día:</span>
          <span className="font-semibold text-gray-100">
            {activeCredits - clientsInArrears} créditos
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Atrasados:</span>
          <span className="font-semibold text-red-400">{clientsInArrears} créditos</span>
        </div>
      </div>
    </div>
  )
}
