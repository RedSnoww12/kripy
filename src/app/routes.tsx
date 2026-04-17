import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import AuthPage from '@/pages/AuthPage';
import OnboardingPage from '@/pages/OnboardingPage';
import HomePage from '@/pages/HomePage';
import MealsPage from '@/pages/MealsPage';
import SportPage from '@/pages/SportPage';
import StatsPage from '@/pages/StatsPage';
import RecipesPage from '@/pages/RecipesPage';
import SettingsPage from '@/pages/SettingsPage';
import TermsPage from '@/pages/TermsPage';
import PrivacyPage from '@/pages/PrivacyPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="meals" element={<MealsPage />} />
        <Route path="sport" element={<SportPage />} />
        <Route path="stats" element={<StatsPage />} />
        <Route path="recipes" element={<RecipesPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
