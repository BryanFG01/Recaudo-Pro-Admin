import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { DailyCollectionData } from '../../domain/models'

interface CollectionChartProps {
  data: DailyCollectionData[]
  period: 'day' | 'week' | 'month'
}

export default function CollectionChart({ data, period }: CollectionChartProps) {
  return (
    <div className="w-full h-full min-h-[300px]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-bold text-white/90 tracking-tight">
          {period === 'day'
            ? 'Recaudo de Hoy'
            : period === 'week'
            ? 'Recaudo Semanal'
            : 'Recaudo del Mes'}
        </h3>
        <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">Movimiento Caja</span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis 
            dataKey="label" 
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600 }} 
            axisLine={false}
            tickLine={false}
            dy={10}
          />
          <YAxis 
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600 }} 
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `$${value / 1000}k`}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            contentStyle={{
              backgroundColor: 'rgba(15, 23, 26, 0.8)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
            }}
            itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: '700' }}
            labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase' }}
            formatter={(value: number) =>
              new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0
              }).format(value)
            }
          />
          <Bar 
            dataKey="amount" 
            fill="url(#colorGradient)" 
            radius={[4, 4, 0, 0]}
            barSize={40}
          />
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#65cc39" stopOpacity={1} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.8} />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
