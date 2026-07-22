import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { RequireProfile } from '@/components/RequireProfile';
import { DashboardPage } from '@/pages/Dashboard';
import { SubjectsPage } from '@/pages/Subjects';
import { SettingsPage } from '@/pages/Settings';
import { NotesPage } from '@/pages/Notes';
import { QuestionsPage } from '@/pages/Questions';
import { ReviewsPage } from '@/pages/Reviews';
import { SessionsPage } from '@/pages/Sessions';
import { TimerPage } from '@/pages/Timer';
import { ProfilesPage } from '@/pages/Profiles';
import { ReleasesPage } from '@/pages/Releases';
import { GoalsPage } from '@/pages/Goals';
import { CalendarPage } from '@/pages/Calendar';
import { PackageGuidePage } from '@/pages/PackageGuide';
import { useStore } from '@/store';

function App() {
  const { loadProfiles } = useStore();

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Profile selection - fullscreen (no sidebar) */}
        <Route path="/profiles" element={<ProfilesPage />} />
        
        {/* Routes with Layout (sidebar) */}
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                
                {/* App routes require an active local profile */}
                <Route
                  path="/"
                  element={
                    <RequireProfile>
                      <DashboardPage />
                    </RequireProfile>
                  }
                />
                <Route
                  path="/subjects"
                  element={
                    <RequireProfile>
                      <SubjectsPage />
                    </RequireProfile>
                  }
                />
                <Route
                  path="/package-guide"
                  element={
                    <RequireProfile>
                      <PackageGuidePage />
                    </RequireProfile>
                  }
                />
                <Route
                  path="/notes"
                  element={
                    <RequireProfile>
                      <NotesPage />
                    </RequireProfile>
                  }
                />
                <Route
                  path="/questions"
                  element={
                    <RequireProfile>
                      <QuestionsPage />
                    </RequireProfile>
                  }
                />
                <Route
                  path="/reviews"
                  element={
                    <RequireProfile>
                      <ReviewsPage />
                    </RequireProfile>
                  }
                />
                <Route
                  path="/study"
                  element={
                    <RequireProfile>
                      <SessionsPage />
                    </RequireProfile>
                  }
                />
                <Route
                  path="/timer"
                  element={
                    <RequireProfile>
                      <TimerPage />
                    </RequireProfile>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <RequireProfile>
                      <SettingsPage />
                    </RequireProfile>
                  }
                />
                <Route
                  path="/releases"
                  element={
                    <RequireProfile>
                      <ReleasesPage />
                    </RequireProfile>
                  }
                />
                <Route
                  path="/calendar"
                  element={
                    <RequireProfile>
                      <CalendarPage />
                    </RequireProfile>
                  }
                />
                <Route
                  path="/goals"
                  element={
                    <RequireProfile>
                      <GoalsPage />
                    </RequireProfile>
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
