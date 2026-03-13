import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import Registration from './pages/Registration';
import Management from './pages/Management'; // We will create this next
import Dashboard from './pages/Dashboard'; // We will create this later
import Login from './pages/Login';
import GlobalSearch from './pages/GlobalSearch';
import Profile from './pages/Profile';
import UsersPage from './pages/Users';
import Analytics from './pages/Analytics';

import { useAppStore } from './store/useAppStore';

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, isLoading } = useAppStore();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-400">Cargando sesión...</div>;

  if (!currentUser) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

function App() {
  const { checkSession } = useAppStore();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route element={<AuthGuard><Layout /></AuthGuard>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/management" element={<Management />} />
          <Route path="/new" element={<Registration />} />
          <Route path="/global" element={<GlobalSearch />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/parte/:id" element={<Registration />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
