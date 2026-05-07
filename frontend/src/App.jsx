import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import useAuthStore from './stores/authStore';
import useThemeStore from './stores/themeStore';

import Sidebar from './components/common/Sidebar';
import ProtectedRoute from './components/common/ProtectedRoute';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';

import AuthorityDashboard from './pages/AuthorityDashboard';
import TouristDashboard from './pages/TouristDashboard';

import IncidentsPage from './pages/IncidentsPage';
import TouristsPage from './pages/TouristsPage';
import GeofencesPage from './pages/GeofencesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AlertsPage from './pages/AlertsPage';

import ProfilePage from './pages/ProfilePage';

const DashboardLayout = ({ children }) => (
  <div className="flex h-screen overflow-hidden bg-[var(--bg-secondary)]">
    <Sidebar />

    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pt-16 lg:pt-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </main>
  </div>
);

function App() {
  const { isAuthenticated, user, initSocket } = useAuthStore();
  const { initTheme } = useThemeStore();

  const location = useLocation();

  useEffect(() => {
    initTheme();

    if (isAuthenticated) {
      initSocket();
    }
  }, [initTheme, isAuthenticated, initSocket]);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>

        {/* PUBLIC ROUTES */}

        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate
                to={user?.role === 'tourist' ? '/tourist' : '/dashboard'}
                replace
              />
            ) : (
              <Landing />
            )
          }
        />

        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate
                to={user?.role === 'tourist' ? '/tourist' : '/dashboard'}
                replace
              />
            ) : (
              <Login />
            )
          }
        />

        <Route
          path="/register"
          element={
            isAuthenticated ? (
              <Navigate
                to={user?.role === 'tourist' ? '/tourist' : '/dashboard'}
                replace
              />
            ) : (
              <Register />
            )
          }
        />

        {/* AUTHORITY ROUTES */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={['authority', 'admin']}>
              <DashboardLayout>
                <AuthorityDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute roles={['authority', 'admin']}>
              <DashboardLayout>
                <AnalyticsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/incidents"
          element={
            <ProtectedRoute roles={['authority', 'admin']}>
              <DashboardLayout>
                <IncidentsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tourists"
          element={
            <ProtectedRoute roles={['authority', 'admin']}>
              <DashboardLayout>
                <TouristsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/geofences"
          element={
            <ProtectedRoute roles={['authority', 'admin']}>
              <DashboardLayout>
                <GeofencesPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/alerts"
          element={
            <ProtectedRoute roles={['authority', 'admin']}>
              <DashboardLayout>
                <AlertsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* TOURIST ROUTES */}

        <Route
          path="/tourist"
          element={
            <ProtectedRoute roles={['tourist']}>
              <DashboardLayout>
                <TouristDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tourist/alerts"
          element={
            <ProtectedRoute roles={['tourist']}>
              <DashboardLayout>
                <AlertsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tourist/profile"
          element={
            <ProtectedRoute roles={['tourist']}>
              <DashboardLayout>
                <ProfilePage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* FALLBACK */}

        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </AnimatePresence>
  );
}

export default App;
