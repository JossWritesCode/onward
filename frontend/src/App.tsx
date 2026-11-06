import { Navigate, Route, Routes } from 'react-router';
import { RedirectIfSignedIn, RequireAuth } from './components/AuthGates';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ApplicationsPage from './pages/ApplicationsPage';
import ApplicationFormPage from './pages/ApplicationFormPage';
import ContactsPage from './pages/ContactsPage';
import ContactFormPage from './pages/ContactFormPage';
import ColumnsPage from './pages/ColumnsPage';
import ProgressPage from './pages/ProgressPage';
import PrepPage from './pages/PrepPage';
import PrepSettingsPage from './pages/PrepSettingsPage';
import StoryFormPage from './pages/StoryFormPage';
import EngineeringPage from './pages/EngineeringPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route element={<RedirectIfSignedIn />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/applications" replace />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/applications/new" element={<ApplicationFormPage />} />
          <Route path="/applications/:id" element={<ApplicationFormPage />} />
          <Route path="/columns" element={<ColumnsPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/prep" element={<PrepPage />} />
          <Route path="/prep/customize" element={<PrepSettingsPage />} />
          <Route path="/engineering" element={<EngineeringPage />} />
          <Route path="/prep/engineering" element={<Navigate to="/engineering" replace />} />
          <Route path="/prep/stories/new" element={<StoryFormPage />} />
          <Route path="/prep/stories/:id" element={<StoryFormPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/contacts/new" element={<ContactFormPage />} />
          <Route path="/contacts/:id" element={<ContactFormPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
