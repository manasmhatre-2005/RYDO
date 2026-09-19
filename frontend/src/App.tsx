import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { AppShell } from './components/layout/AppShell';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { PassengerDashboard } from './pages/passenger/PassengerDashboard';
import { DriverDashboard } from './pages/driver/DriverDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';

const MainLayout: React.FC = () => {
  const { user, role, isLoading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Reset tab to appropriate default whenever role switches
  useEffect(() => {
    if (role === 'admin') {
      setCurrentTab('overview');
    } else {
      setCurrentTab('dashboard');
    }
  }, [role]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-pearl-100 flex flex-col items-center justify-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-electric-600 to-electric-400 flex items-center justify-center font-black text-white text-2xl shadow-xl shadow-electric-500/20 animate-pulse">
          R
        </div>
        <div className="text-xs text-slate-500 font-semibold tracking-wide">
          Connecting to RYDO Network...
        </div>
      </div>
    );
  }

  if (!user) {
    if (authView === 'register') {
      return <Register onNavigateToLogin={() => setAuthView('login')} />;
    }
    return <Login onNavigateToRegister={() => setAuthView('register')} />;
  }

  return (
    <AppShell currentTab={currentTab} onTabChange={setCurrentTab}>
      {role === 'driver' && (
        <DriverDashboard currentTab={currentTab} onTabChange={setCurrentTab} />
      )}
      {role === 'admin' && (
        <AdminDashboard currentTab={currentTab} onTabChange={setCurrentTab} />
      )}
      {(role === 'passenger' || !role) && (
        <PassengerDashboard currentTab={currentTab} onTabChange={setCurrentTab} />
      )}
    </AppShell>
  );
};

export function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <MainLayout />
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
