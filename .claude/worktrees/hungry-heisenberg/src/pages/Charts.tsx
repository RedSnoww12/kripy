import { useAppStore } from '../stores/appStore'
import { WeightChart } from '../components/charts/WeightChart'

export function Charts() {
  const { logs } = useAppStore()
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white">Graphiques</h2>
      <WeightChart logs={sorted.slice(-30)} />

      {sorted.length > 0 && (
        <div className="bg-dark-800 rounded-2xl p-4">
          <p className="text-xs text-dark-500 mb-3 font-medium">Statistiques (30j)</p>
          <div className="grid grid-cols-2 gap-4">
            {(() => {
              const w = sorted.slice(-30).map((l) => l.morning_weight).filter((w): w is number => w !== null)
              const cal = sorted.slice(-30).map((l) => l.calories_consumed)
              return (
                <>
                  <Stat label="Poids min" value={w.length ? `${Math.min(...w).toFixed(1)} kg` : '--'} />
                  <Stat label="Poids max" value={w.length ? `${Math.max(...w).toFixed(1)} kg` : '--'} />
                  <Stat label="Moy. calories" value={cal.length ? `${Math.round(cal.reduce((a, b) => a + b, 0) / cal.length)} kcal` : '--'} />
                  <Stat label="Jours trackés" value={`${sorted.length}`} />
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-[10px] text-dark-500">{label}</p>
      <p className="text-sm font-bold text-white">{value}</p>
    </div>
  )
}
