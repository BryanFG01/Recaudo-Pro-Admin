import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { DailyCollectionData } from '../../domain/models'

interface CollectionChartProps {
  data: DailyCollectionData[]
  period: 'day' | 'week' | 'month'
}

export default function CollectionChart({ data, period }: CollectionChartProps) {
  return (
    <div className="bg-[#0f171a] border border-gray-600 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4 text-white">
        {period === 'day'
          ? 'Recaudo de Hoy'
          : period === 'week'
          ? 'Recaudo Semanal'
          : 'Recaudo del Mes'}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
          <XAxis dataKey="label" tick={{ fill: '#9ca3af' }} stroke="#6b7280" />
          <YAxis tick={{ fill: '#9ca3af' }} stroke="#6b7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #4b5563',
              borderRadius: '6px'
            }}
            labelStyle={{ color: '#e5e7eb' }}
            formatter={(value: number) =>
              new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0
              }).format(value)
            }
          />
          <Bar dataKey="amount" fill="#65cc39" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
