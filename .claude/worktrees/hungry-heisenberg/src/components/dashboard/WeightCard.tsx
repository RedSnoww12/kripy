import { Scale, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import type { Trend } from '../../types'

interface WeightCardProps {
  weight: number | null
  trend: Trend
  average: number | null
  onEdit: () => void
}

const trendConfig = {
  baisse: { icon: TrendingDown, color: 'text-success', label: 'Baisse' },
  hausse: { icon: TrendingUp, color: 'text-warning', label: 'Hausse' },
  stagne: { icon: Minus, color: 'text-dark-400', label: 'Stable' },
}

export function WeightCard({ weight, trend, average, onEdit }: WeightCardProps) {
  const { icon: TrendIcon, color, label } = trendConfig[trend]

  return (
    <button
      onClick={onEdit}
      className="w-full bg-dark-800 rounded-2xl p-4 flex items-center gap-4 active:bg-dark-700 transition-colors text-left"
    >
      <div className="w-12 h-12 rounded-xl bg-dark-700 flex items-center justify-center">
        <Scale size={22} className="text-accent" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-dark-500 mb-0.5">Poids du jour</p>
        <p className="text-xl font-bold text-white tabular-nums">
          {weight !== null ? `${weight.toFixed(1)} kg` : '-- kg'}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <div className={`flex items-center gap-1 ${color}`}>
          <TrendIcon size={16} />
          <span className="text-xs font-medium">{label}</span>
        </div>
        {average !== null && (
          <span className="text-[10px] text-dark-500">
            Moy. {average.toFixed(1)} kg
          </span>
        )}
      </div>
    </button>
  )
}
