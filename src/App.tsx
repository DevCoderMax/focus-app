import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { RequireProfile } from '@/components/RequireProfile';
import { DashboardPage } from '@/pages/Dashboard';
import { SubjectsPage } from '@/pages/Subjects';
import { SettingsPage } from '@/pages/Settings';
import { NotesPage, QuestionsPage, ReviewsPage } from '@/pages/Placeholder';
import { SessionsPage } from '@/pages/Sessions';
import { TimerPage } from '@/pages/Timer';
import { ProfilesPage } from '@/pages/Profiles';
import { ReleasesPage } from '@/pages/Releases';
import { CalendarPage } from '@/pages/Calendar';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { useStore } from '@/store';

function App() {
  const { activeProfileId, loadProfiles } = useStore();

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  // Check if user is authenticated
  const isAuthenticated = !!localStorage.getItem('focus.token');

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes - outside Layout (no sidebar) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Profile selection - fullscreen (no sidebar) */}
        <Route path="/profiles" element={<ProfilesPage />} />
        
        {/* Routes with Layout (sidebar) */}
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                
                {/* Protected routes - require auth AND profile */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <RequireProfile>
                        <DashboardPage />
                      </RequireProfile>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/subjects"
                  element={
                    <ProtectedRoute>
                      <RequireProfile>
                        <SubjectsPage />
                      </RequireProfile>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notes"
                  element={
                    <ProtectedRoute>
                      <RequireProfile>
                        <NotesPage />
                      </RequireProfile>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/questions"
                  element={
                    <ProtectedRoute>
                      <RequireProfile>
                        <QuestionsPage />
                      </RequireProfile>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reviews"
                  element={
                    <ProtectedRoute>
                      <RequireProfile>
                        <ReviewsPage />
                      </RequireProfile>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/study"
                  element={
                    <ProtectedRoute>
                      <RequireProfile>
                        <SessionsPage />
                      </RequireProfile>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/timer"
                  element={
                    <ProtectedRoute>
                      <RequireProfile>
                        <TimerPage />
                      </RequireProfile>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <RequireProfile>
                        <SettingsPage />
                      </RequireProfile>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/releases"
                  element={
                    <ProtectedRoute>
                      <RequireProfile>
                        <ReleasesPage />
                      </RequireProfile>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/calendar"
                  element={
                    <ProtectedRoute>
                      <RequireProfile>
                        <CalendarPage />
                      </RequireProfile>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
