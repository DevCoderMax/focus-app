import { Navigate } from 'react-router-dom';
import { useStore } from '@/store';

interface RequireProfileProps {
  children: React.ReactNode;
}

export function RequireProfile({ children }: RequireProfileProps) {
  const { activeProfileId } = useStore();

  // If no profile is selected, redirect to profiles page
  if (!activeProfileId) {
    return <Navigate to="/profiles" replace />;
  }

  return <>{children}</>;
}
