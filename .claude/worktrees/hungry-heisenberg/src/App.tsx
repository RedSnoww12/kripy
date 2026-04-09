import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { AppShell } from './components/layout/AppShell'
import { useAppStore } from './stores/appStore'
import { useAuth } from './hooks/useAuth'
import { Dashboard } from './pages/Dashboard'
import { History } from './pages/History'
import { Charts } from './pages/Charts'
import { Profile } from './pages/Profile'
import { Settings } from './pages/Settings'
import { Login } from './pages/Login'

const pages: Record<string, () => React.JSX.Element> = {
  dashboard: Dashboard,
  history: History,
  charts: Charts,
  profile: Profile,
  settings: Settings,
}

function App() {
  const activeTab = useAppStore((s) => s.activeTab)
  const setUserId = useAppStore((s) => s.setUserId)
  const loadFromSupabase = useAppStore((s) => s.loadFromSupabase)
  const { user, loading, error, signInWithGoogle } = useAuth()

  useEffect(() => {
    if (user) {
      setUserId(user.id)
      loadFromSupabase()
    }
  }, [user, setUserId, loadFromSupabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="text-accent animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Login onGoogleLogin={signInWithGoogle} loading={false} error={error} />
  }

  const Page = pages[activeTab] ?? Dashboard

  return (
    <AppShell>
      <Page />
    </AppShell>
  )
}

export default App
