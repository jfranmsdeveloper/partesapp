import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import Registration from './pages/Registration';
import Management from './pages/Management'; // We will create this next
import Indicadores from './pages/Dashboard'; // Rebranded from Dashboard to Indicadores
import Login from './pages/Login';
import GlobalSearch from './pages/GlobalSearch';
import Profile from './pages/Profile';
import UsersPage from './pages/Users';
import Analytics from './pages/Analytics';
import Calendar from './pages/Calendar';

import { useAppStore } from './store/useAppStore';
import { useToast } from './components/ui/Toast';
import { isPast, parseISO, isWithinInterval, subMinutes, addMinutes } from 'date-fns';

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, isLoading } = useAppStore();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-400">Cargando sesión...</div>;

  if (!currentUser) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

function App() {
  const { checkSession, reminders, updateReminder } = useAppStore();
  const toast = useToast();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Reminder Notification Engine
  useEffect(() => {
    if (!reminders.length) return;

    const checkReminders = () => {
      const now = new Date();
      reminders.forEach(reminder => {
        if (reminder.completed || reminder.notified) return;

        const dueDate = parseISO(reminder.dueDate);
        
        // Notify if it's due now (within a 2-minute window) or past due
        if (isPast(dueDate) || isWithinInterval(now, {
            start: subMinutes(dueDate, 1),
            end: addMinutes(dueDate, 1)
        })) {
          toast.warn(`Recordatorio: ${reminder.text}`);
          updateReminder(reminder.id, { notified: true });
        }
      });
    };

    // Immediate check
    checkReminders();

    const interval = setInterval(checkReminders, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [reminders, toast, updateReminder]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<AuthGuard><Layout /></AuthGuard>}>
          <Route path="/" element={<Indicadores />} />
          <Route path="/management" element={<Management />} />
          <Route path="/new" element={<Registration />} />
          <Route path="/global" element={<GlobalSearch />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/calendar" element={<Calendar />} />
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
