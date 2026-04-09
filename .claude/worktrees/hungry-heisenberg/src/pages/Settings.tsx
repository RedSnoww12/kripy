import { useState } from 'react'
import { Eye, EyeOff, Trash2, LogOut, ChevronDown } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { useAuth } from '../hooks/useAuth'
import type { AIProvider } from '../types'
import { AI_PROVIDER_LABELS } from '../types'

const PROVIDER_KEY_PLACEHOLDER: Record<AIProvider, string> = {
  openai: 'sk-...',
  gemini: 'AIza...',
  anthropic: 'sk-ant-...',
}

const PROVIDER_KEY_LABEL: Record<AIProvider, string> = {
  openai: 'Clé API OpenAI',
  gemini: 'Clé API Google Gemini',
  anthropic: 'Clé API Anthropic',
}

const PROVIDER_NOTE: Record<AIProvider, string> = {
  openai: 'Supporte photo, audio et texte. Stockée localement.',
  gemini: 'Supporte photo, audio et texte. Stockée localement.',
  anthropic: "Supporte photo et texte (pas l'audio). Stockée localement.",
}

function getProviderKey(profile: ReturnType<typeof useAppStore>['profile'], provider: AIProvider): string {
  switch (provider) {
    case 'openai': return profile.openai_api_key
    case 'gemini': return profile.gemini_api_key
    case 'anthropic': return profile.anthropic_api_key
  }
}

function setProviderKey(provider: AIProvider, value: string): Partial<ReturnType<typeof useAppStore>['profile']> {
  switch (provider) {
    case 'openai': return { openai_api_key: value }
    case 'gemini': return { gemini_api_key: value }
    case 'anthropic': return { anthropic_api_key: value }
  }
}

export function Settings() {
  const { profile, setProfile } = useAppStore()
  const { user, signOut } = useAuth()
  const [showKey, setShowKey] = useState(false)
  const [showProviderMenu, setShowProviderMenu] = useState(false)

  const handleClearData = () => {
    if (confirm('Supprimer toutes les données ? Cette action est irréversible.')) {
      localStorage.removeItem('nutricoach-storage')
      window.location.reload()
    }
  }

  const currentProvider = profile.ai_provider
  const currentKey = getProviderKey(profile, currentProvider)

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white">Réglages</h2>

      {/* AI Provider */}
      <div className="bg-dark-800 rounded-2xl p-4 space-y-4">
        <div>
          <p className="text-xs text-dark-500 mb-1.5">Fournisseur IA</p>
          <div className="relative">
            <button
              onClick={() => setShowProviderMenu(!showProviderMenu)}
              className="w-full bg-dark-700 rounded-xl px-4 py-3 text-white text-sm outline-none flex items-center justify-between"
            >
              <span>{AI_PROVIDER_LABELS[currentProvider]}</span>
              <ChevronDown size={16} className={`text-dark-500 transition-transform ${showProviderMenu ? 'rotate-180' : ''}`} />
            </button>
            {showProviderMenu && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-dark-700 rounded-xl overflow-hidden z-10 shadow-lg">
                {(Object.keys(AI_PROVIDER_LABELS) as AIProvider[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setProfile({ ai_provider: p })
                      setShowProviderMenu(false)
                    }}
                    className={`w-full px-4 py-3 text-sm text-left transition-colors ${
                      p === currentProvider ? 'text-accent bg-dark-600' : 'text-white hover:bg-dark-600'
                    }`}
                  >
                    {AI_PROVIDER_LABELS[p]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs text-dark-500 mb-1.5">{PROVIDER_KEY_LABEL[currentProvider]}</p>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={currentKey}
              onChange={(e) => setProfile(setProviderKey(currentProvider, e.target.value))}
              placeholder={PROVIDER_KEY_PLACEHOLDER[currentProvider]}
              className="w-full bg-dark-700 rounded-xl px-4 py-3 pr-12 text-white text-sm outline-none"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500"
            >
              {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="text-[10px] text-dark-600 mt-1">{PROVIDER_NOTE[currentProvider]}</p>
        </div>
      </div>

      {/* Account */}
      <div className="bg-dark-800 rounded-2xl p-4 space-y-3">
        {user && (
          <div className="flex items-center gap-3 pb-3 border-b border-dark-700">
            <div className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center text-white font-bold text-sm">
              {user.user_metadata?.full_name?.[0] ?? user.email?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">{user.user_metadata?.full_name ?? 'Utilisateur'}</p>
              <p className="text-[10px] text-dark-500 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={signOut}
          className="flex items-center gap-3 text-dark-400 text-sm w-full"
        >
          <LogOut size={18} />
          Se déconnecter
        </button>
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
