import { Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { AuthLayout } from './components/layout/AuthLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { PropertyListPage } from './pages/PropertyListPage';
import { PropertyDetailPage } from './pages/PropertyDetailPage';
import { PropertyCreatePage } from './pages/PropertyCreatePage';
import { RoommateSwipePage } from './pages/RoommateSwipePage';
import { MatchesPage } from './pages/MatchesPage';
import { MessagesPage } from './pages/MessagesPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { ApplicationWorkflowPage } from './pages/ApplicationWorkflowPage';
import { LeasesPage } from './pages/LeasesPage';
import { PublicProfilePage } from './pages/PublicProfilePage';
import { OnboardingPage } from './pages/OnboardingPage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Protected routes — onboarding (no MainLayout) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
      </Route>

      {/* Protected routes — main app */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/properties" element={<PropertyListPage />} />
          <Route path="/properties/new" element={<PropertyCreatePage />} />
          <Route path="/properties/:id" element={<PropertyDetailPage />} />
          <Route path="/roommates" element={<RoommateSwipePage />} />
          <Route path="/matches" element={<MatchesPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/messages/:conversationId" element={<MessagesPage />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/applications/:id/workflow" element={<ApplicationWorkflowPage />} />
          <Route path="/leases" element={<LeasesPage />} />
          <Route path="/users/:id" element={<PublicProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
