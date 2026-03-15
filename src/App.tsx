import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { DashboardPage } from '@/pages/Dashboard';
import { SubjectsPage } from '@/pages/Subjects';
import { SettingsPage } from '@/pages/Settings';
import { NotesPage, QuestionsPage, ReviewsPage } from '@/pages/Placeholder';
import { SessionsPage } from '@/pages/Sessions';
import { TimerPage } from '@/pages/Timer';
import { ProfilesPage } from '@/pages/Profiles';
import { ReleasesPage } from '@/pages/Releases';
import { CalendarPage } from '@/pages/Calendar';
import { useStore } from '@/store';

function App() {
  const { activeProfileId, loadProfiles } = useStore();

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/profiles" element={<ProfilesPage />} />
          <Route
            path="/"
            element={
              activeProfileId ? <DashboardPage /> : <Navigate to="/profiles" replace />
            }
          />
          <Route
            path="/subjects"
            element={
              activeProfileId ? <SubjectsPage /> : <Navigate to="/profiles" replace />
            }
          />
          <Route
            path="/notes"
            element={
              activeProfileId ? <NotesPage /> : <Navigate to="/profiles" replace />
            }
          />
          <Route
            path="/questions"
            element={
              activeProfileId ? <QuestionsPage /> : <Navigate to="/profiles" replace />
            }
          />
          <Route
            path="/reviews"
            element={
              activeProfileId ? <ReviewsPage /> : <Navigate to="/profiles" replace />
            }
          />
          <Route
            path="/study"
            element={
              activeProfileId ? <SessionsPage /> : <Navigate to="/profiles" replace />
            }
          />
          <Route
            path="/timer"
            element={
              activeProfileId ? <TimerPage /> : <Navigate to="/profiles" replace />
            }
          />
          <Route
            path="/settings"
            element={
              activeProfileId ? <SettingsPage /> : <Navigate to="/profiles" replace />
            }
          />
          <Route
            path="/releases"
            element={
              activeProfileId ? <ReleasesPage /> : <Navigate to="/profiles" replace />
            }
          />
          <Route
            path="/calendar"
            element={
              activeProfileId ? <CalendarPage /> : <Navigate to="/profiles" replace />
            }
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
