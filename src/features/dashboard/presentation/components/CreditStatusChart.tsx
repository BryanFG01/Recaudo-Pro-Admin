import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

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
  clientsInArrears,
}: CreditStatusChartProps) {
  const data = [
    { name: 'Al Día', value: upToDatePercentage, count: activeCredits - clientsInArrears },
    { name: 'Atrasados', value: overduePercentage, count: clientsInArrears },
  ]

  const COLORS = ['#10b981', '#ef4444']

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Estado de Créditos</h3>
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
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Al Día:</span>
          <span className="font-semibold">{activeCredits - clientsInArrears} créditos</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Atrasados:</span>
          <span className="font-semibold text-error">{clientsInArrears} créditos</span>
        </div>
      </div>
    </div>
  )
}


