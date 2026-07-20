import { Navigate } from 'react-router-dom';
import { useStore } from '@/store';

interface RequireProfileProps {
  children: React.ReactNode;
}

export function RequireProfile({ children }: RequireProfileProps) {
  const { activeProfileId, profiles, profilesLoaded } = useStore();

  // Wait until profiles have been fetched to avoid redirect flash
  if (!profilesLoaded) {
    return null;
  }

  // No profiles at all → go create the first one
  if (profiles.length === 0) {
    return <Navigate to="/profiles" replace />;
  }

  // No active profile selected → go to profiles page
  if (!activeProfileId) {
    return <Navigate to="/profiles" replace />;
  }

  // Active profile doesn't exist in the list → go to profiles page
  const profileExists = profiles.some((p) => p.id === activeProfileId);
  if (!profileExists) {
    return <Navigate to="/profiles" replace />;
  }

  return <>{children}</>;
}
