import { LayoutDashboard, History, BarChart3, User, Settings } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'

const tabs = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Accueil' },
  { id: 'history', icon: History, label: 'Historique' },
  { id: 'charts', icon: BarChart3, label: 'Graphiques' },
  { id: 'profile', icon: User, label: 'Profil' },
  { id: 'settings', icon: Settings, label: 'Réglages' },
]

export function BottomNav() {
  const { activeTab, setActiveTab } = useAppStore()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-dark-800/95 backdrop-blur-md border-t border-dark-700 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
                active ? 'text-accent' : 'text-dark-500'
              }`}
            >
              <tab.icon size={22} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
