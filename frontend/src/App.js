import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

// Context
import { AuthProvider } from './contexts/AuthContext';

// Components
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import ProfilePage from './pages/Auth/ProfilePage';
import TournamentsPage from './pages/Tournaments/TournamentsPage';
import TournamentDetailPage from './pages/Tournaments/TournamentDetailPage';
import CreateTournamentPage from './pages/Tournaments/CreateTournamentPage';
import TeamsPage from './pages/Teams/TeamsPage';
import CreateTeamPage from './pages/Teams/CreateTeamPage';
import ManagerPage from './pages/Teams/ManagerPage';
import TeamDetailPage from './pages/Teams/TeamDetailPage';
import MatchesPage from './pages/Matches/MatchesPage';
import MatchDetailPage from './pages/Matches/MatchDetailPage';
import StandingsPage from './pages/Standings/StandingsPage';
import AdminPage from './pages/Admin/AdminPage';
import NotFoundPage from './pages/NotFoundPage';
import TournamentApplicationPage from './pages/Tournaments/TournamentApplicationPage';
import UsersPage from './pages/Admin/UsersPage';
import AdminTeamsPage from './pages/Admin/TeamsPage';
import AdminTournamentsPage from './pages/Admin/TournamentsPage';
import ApplicationsPage from './pages/Admin/ApplicationsPage';
import StatsPage from './pages/Admin/StatsPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#22c55e',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
            
            <Routes>
              {/* Public Routes */}
              <Route path="/giris" element={<LoginPage />} />
              <Route path="/kayit" element={<RegisterPage />} />
              
              {/* Protected Routes with Layout */}
              <Route path="/" element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="turnuvalar" element={<TournamentsPage />} />
                <Route path="turnuva-olustur" element={<CreateTournamentPage />} />
                <Route path="turnuva/:id" element={<TournamentDetailPage />} />
                <Route path="turnuva/:id/basvuru" element={<TournamentApplicationPage />} />
                <Route path="turnuva/:id/fikstur" element={<MatchesPage />} />
                <Route path="turnuva/:id/puan" element={<StandingsPage />} />
                <Route path="takımlar" element={<TeamsPage />} />
                <Route path="takım-olustur" element={<CreateTeamPage />} />
                <Route path="menejer" element={<ManagerPage />} />
                <Route path="takim/:id" element={<TeamDetailPage />} />
                <Route path="mac/:id" element={<MatchDetailPage />} />
                
                {/* Protected Routes - Require Authentication */}
                <Route path="profil" element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } />
                <Route path="turnuva-olustur" element={
                  <ProtectedRoute requiredRole="organizer">
                    <CreateTournamentPage />
                  </ProtectedRoute>
                } />
                <Route path="admin" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminPage />
                  </ProtectedRoute>
                } />
                <Route path="admin/users" element={
                  <ProtectedRoute requiredRole="admin">
                    <UsersPage />
                  </ProtectedRoute>
                } />
                <Route path="admin/teams" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminTeamsPage />
                  </ProtectedRoute>
                } />
                <Route path="admin/tournaments" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminTournamentsPage />
                  </ProtectedRoute>
                } />
                <Route path="admin/applications" element={
                  <ProtectedRoute requiredRole="admin">
                    <ApplicationsPage />
                  </ProtectedRoute>
                } />
                <Route path="admin/stats" element={
                  <ProtectedRoute requiredRole="admin">
                    <StatsPage />
                  </ProtectedRoute>
                } />
              </Route>
              
              {/* 404 Page */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;