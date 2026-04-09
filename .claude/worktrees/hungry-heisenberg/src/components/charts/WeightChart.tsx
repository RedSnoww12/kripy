import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import type { DailyLog } from '../../types'
import { computeMovingAverage } from '../../lib/algorithm'

interface WeightChartProps {
  logs: DailyLog[]
}

export function WeightChart({ logs }: WeightChartProps) {
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date))

  const data = sorted.map((log, i) => {
    const windowWeights = sorted.slice(Math.max(0, i - 4), i + 1).map((l) => l.morning_weight)
    const smoothed = computeMovingAverage(windowWeights)
    return {
      date: new Date(log.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      poids: log.morning_weight,
      lisse: smoothed ? Number(smoothed.toFixed(1)) : null,
      calories: log.calories_consumed,
    }
  })

  if (data.length === 0) {
    return (
      <div className="bg-dark-800 rounded-2xl p-6 text-center">
        <p className="text-dark-500 text-sm">Pas encore de données. Commence par ajouter ton poids.</p>
      </div>
    )
  }

  return (
    <div className="bg-dark-800 rounded-2xl p-4">
      <p className="text-xs text-dark-500 mb-3 font-medium">Poids & Calories (7j)</p>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
          <YAxis
            yAxisId="weight"
            domain={['auto', 'auto']}
            tick={{ fontSize: 10, fill: '#64748b' }}
          />
          <YAxis
            yAxisId="cal"
            orientation="right"
            domain={[0, 'auto']}
            tick={{ fontSize: 10, fill: '#64748b' }}
            hide
          />
          <Tooltip
            contentStyle={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 12,
              fontSize: 12,
            }}
            labelStyle={{ color: '#94a3b8' }}
          />
          <Bar
            yAxisId="cal"
            dataKey="calories"
            fill="#22d3ee"
            opacity={0.15}
            radius={[4, 4, 0, 0]}
            name="Calories"
          />
          <Line
            yAxisId="weight"
            type="monotone"
            dataKey="poids"
            stroke="#475569"
            strokeWidth={1}
            dot={{ fill: '#475569', r: 2 }}
            name="Poids brut"
          />
          <Line
            yAxisId="weight"
            type="monotone"
            dataKey="lisse"
            stroke="#22d3ee"
            strokeWidth={2.5}
            dot={false}
            name="Tendance"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
