import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { DashboardPage } from '@/pages/Dashboard';
import { SubjectsPage } from '@/pages/Subjects';
import { SettingsPage } from '@/pages/Settings';
import { NotesPage, QuestionsPage, ReviewsPage } from '@/pages/Placeholder';
import { SessionsPage } from '@/pages/Sessions';
import { TimerPage } from '@/pages/Timer';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/subjects" element={<SubjectsPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/questions" element={<QuestionsPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/study" element={<SessionsPage />} />
          <Route path="/timer" element={<TimerPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
