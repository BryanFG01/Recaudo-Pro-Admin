import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { DailyCollectionData } from '../../domain/models'

interface CollectionChartProps {
  data: DailyCollectionData[]
  period: 'day' | 'week' | 'month'
}

export default function CollectionChart({ data, period }: CollectionChartProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">
        {period === 'day' ? 'Recaudo de Hoy' : period === 'week' ? 'Recaudo Semanal' : 'Recaudo del Mes'}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip
            formatter={(value: number) => 
              new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0,
              }).format(value)
            }
          />
          <Bar dataKey="amount" fill="#0ea5e9" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}


