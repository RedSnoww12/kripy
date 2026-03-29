import { useState } from 'react'
import { Eye, EyeOff, Trash2 } from 'lucide-react'
import { useAppStore } from '../stores/appStore'

export function Settings() {
  const { profile, setProfile } = useAppStore()
  const [showKey, setShowKey] = useState(false)

  const handleClearData = () => {
    if (confirm('Supprimer toutes les données ? Cette action est irréversible.')) {
      localStorage.removeItem('nutricoach-storage')
      window.location.reload()
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white">Réglages</h2>

      <div className="bg-dark-800 rounded-2xl p-4 space-y-4">
        <div>
          <p className="text-xs text-dark-500 mb-1.5">Clé API OpenAI</p>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={profile.openai_api_key}
              onChange={(e) => setProfile({ openai_api_key: e.target.value })}
              placeholder="sk-..."
              className="w-full bg-dark-700 rounded-xl px-4 py-3 pr-12 text-white text-sm outline-none"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500"
            >
              {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="text-[10px] text-dark-600 mt-1">
            Nécessaire pour l'analyse photo et audio. Stockée localement.
          </p>
        </div>
      </div>

      <div className="bg-dark-800 rounded-2xl p-4">
        <button
          onClick={handleClearData}
          className="flex items-center gap-3 text-danger text-sm w-full"
        >
          <Trash2 size={18} />
          Effacer toutes les données
        </button>
      </div>
    </div>
  )
}
