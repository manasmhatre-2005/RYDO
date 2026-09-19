import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { PassengerDashboard } from './pages/passenger/PassengerDashboard';
import { DriverDashboard } from './pages/driver/DriverDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';

const MainLayout: React.FC = () => {
  const { user, role, isLoading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center font-black text-dark-950 text-2xl shadow-xl shadow-brand-500/20 animate-pulse">
          R
        </div>
        <div className="text-xs text-slate-400 font-semibold tracking-wide">
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
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col">
      <Navbar />
      <main className="flex-1">
        {role === 'driver' && <DriverDashboard />}
        {role === 'admin' && <AdminDashboard />}
        {(role === 'passenger' || !role) && <PassengerDashboard />}
      </main>
      <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-slate-300">RYDO</span>
            <span>—</span>
            <span>Move Smarter. Ride Better.</span>
          </div>
          <div>
            Production-Ready Ride Booking Platform • Render Cloud Ready
          </div>
        </div>
      </footer>
    </div>
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
