import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

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
    { name: 'Saldos al Día', value: upToDatePercentage, count: activeCredits - clientsInArrears, color: '#10b981' },
    { name: 'En Mora', value: overduePercentage, count: clientsInArrears, color: '#ef4444' }
  ]

  return (
    <div className="w-full h-full min-h-[300px]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-bold text-foreground tracking-tight">Estado de Créditos</h3>
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Cartera Actual</span>
      </div>
      
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="relative w-full md:w-1/2 h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  color: 'hsl(var(--popover-foreground))',
                }}
                itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-black text-foreground tabular-nums">{activeCredits}</span>
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total</span>
          </div>
        </div>

        <div className="w-full md:w-1/2 space-y-4">
          {data.map((item) => (
            <div key={item.name} className="group p-3 rounded-xl bg-muted/30 border border-border hover:bg-muted/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full shadow-sm" 
                    style={{ backgroundColor: item.color }} 
                  />
                  <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-wide">
                    {item.name}
                  </span>
                </div>
                <span className="text-xs font-black text-foreground tabular-nums">
                  {item.value.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-extrabold text-foreground tabular-nums">{item.count}</span>
                <span className="text-[10px] text-muted-foreground font-medium italic">créditos</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
