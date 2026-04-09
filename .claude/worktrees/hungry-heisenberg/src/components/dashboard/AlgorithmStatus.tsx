import { Zap, CheckCircle, AlertTriangle } from 'lucide-react'
import type { AlgorithmResult } from '../../types'
import { PHASE_LABELS, type Phase } from '../../types'

interface AlgorithmStatusProps {
  result: AlgorithmResult
  phase: Phase
}

const colorMap = {
  green: {
    bg: 'bg-success/10',
    border: 'border-success/30',
    text: 'text-success',
    icon: CheckCircle,
  },
  orange: {
    bg: 'bg-warning/10',
    border: 'border-warning/30',
    text: 'text-warning',
    icon: AlertTriangle,
  },
  blue: {
    bg: 'bg-info/10',
    border: 'border-info/30',
    text: 'text-info',
    icon: Zap,
  },
}

export function AlgorithmStatus({ result, phase }: AlgorithmStatusProps) {
  const config = colorMap[result.color]
  const StatusIcon = config.icon

  return (
    <div className={`rounded-2xl p-4 border ${config.bg} ${config.border}`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${config.text}`}>
          <StatusIcon size={20} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-dark-400">
              Phase : {PHASE_LABELS[phase]}
            </span>
          </div>
          <p className="text-sm font-semibold text-white leading-snug">
            {result.message}
          </p>
          {result.amount > 0 && (
            <p className="text-xs text-dark-400 mt-1.5">
              Ajuster uniquement les glucides de {result.action === 'decrease' ? '-' : '+'}50g.
              Protéines et lipides stables.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
