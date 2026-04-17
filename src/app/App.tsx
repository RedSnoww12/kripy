import { useAuthListener } from '@/features/auth/useAuth';
import { useCloudSync } from '@/hooks/useCloudSync';
import { useTheme } from '@/hooks/useTheme';
import { useStepUrlParam } from '@/hooks/useStepUrlParam';
import ToastRoot from '@/components/ui/Toast';
import AppRoutes from './routes';

export default function App() {
  useAuthListener();
  useCloudSync();
  useTheme();
  useStepUrlParam();

  return (
    <>
      <AppRoutes />
      <ToastRoot />
    </>
  );
}
