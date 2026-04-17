import { Outlet } from 'react-router-dom';
import AuthGate from './AuthGate';
import RequireSetup from './RequireSetup';
import Header from './Header';
import BottomNav from './BottomNav';

export default function AppLayout() {
  return (
    <AuthGate>
      <RequireSetup>
        <Header />
        <main className="tc">
          <Outlet />
        </main>
        <BottomNav />
      </RequireSetup>
    </AuthGate>
  );
}
