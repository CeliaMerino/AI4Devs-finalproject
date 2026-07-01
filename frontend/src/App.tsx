import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { BookTrackerPage } from './pages/BookTrackerPage';
import { HomePage } from './pages/HomePage';
import { ListsPage } from './pages/ListsPage';
import { LoginPage } from './pages/LoginPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { StatsPage } from './pages/StatsPage';
import './App.css';

const queryClient = new QueryClient();

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="book-tracker" element={<BookTrackerPage />} />
        <Route path="lists" element={<ListsPage />} />
        <Route path="stats" element={<StatsPage />} />
        <Route
          path="goals"
          element={
            <PlaceholderPage
              title="Goals"
              description="Annual reading goals, forecast, and progress tracking will live here."
            />
          }
        />
        <Route
          path="library"
          element={
            <PlaceholderPage
              title="Library"
              description="Your full reading history with advanced search and filters will live here."
            />
          }
        />
        <Route
          path="recap"
          element={
            <PlaceholderPage
              title="Recap / Insights"
              description="Monthly and annual reading recaps and automatic insights will live here."
            />
          }
        />
        <Route
          path="import-export"
          element={
            <PlaceholderPage
              title="Import / Export"
              description="Import from Excel, CSV, or Goodreads and export your data will live here."
            />
          }
        />
        <Route
          path="profile"
          element={
            <PlaceholderPage
              title="Profile / Settings"
              description="Account profile and application settings will live here."
            />
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
