import { AppShell } from './components/layout/AppShell'
import { useAppStore } from './stores/appStore'
import { Dashboard } from './pages/Dashboard'
import { History } from './pages/History'
import { Charts } from './pages/Charts'
import { Profile } from './pages/Profile'
import { Settings } from './pages/Settings'

const pages: Record<string, () => JSX.Element> = {
  dashboard: Dashboard,
  history: History,
  charts: Charts,
  profile: Profile,
  settings: Settings,
}

function App() {
  const activeTab = useAppStore((s) => s.activeTab)
  const Page = pages[activeTab] ?? Dashboard

  return (
    <AppShell>
      <Page />
    </AppShell>
  )
}

export default App
