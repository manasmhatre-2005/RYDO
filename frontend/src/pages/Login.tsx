import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import { Car, ShieldCheck, User, Sparkles, ArrowRight, Lock, Mail, AlertCircle } from 'lucide-react';

interface LoginProps {
  onNavigateToRegister: () => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigateToRegister }) => {
  const { login, demoLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: Role) => {
    setError(null);
    setLoading(true);
    try {
      await demoLogin(role);
    } catch (err: any) {
      setError(err.response?.data?.detail || `Failed to sign in with demo ${role}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 shadow-xl shadow-brand-500/20 text-dark-950 font-black text-2xl mb-4">
          R
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">RYDO</h1>
        <p className="mt-1 text-sm text-brand-400 font-semibold tracking-wide">Move Smarter. Ride Better.</p>
        <p className="mt-2 text-xs text-slate-400">Enterprise Full-Stack Ride Booking Platform</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 z-10">
        <div className="bg-dark-900/90 backdrop-blur-xl py-8 px-6 sm:px-8 border border-slate-800 rounded-3xl shadow-2xl">
          
          {/* Quick 1-Click Demo Logins Section */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>Instant 1-Click Demo Login</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('passenger')}
                disabled={loading}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-dark-800 hover:bg-dark-700/80 border border-brand-500/30 text-slate-200 transition hover:scale-[1.02] cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center mb-1 group-hover:bg-brand-500 group-hover:text-dark-950 transition">
                  <User className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-white">Passenger</span>
                <span className="text-[9px] text-slate-400">Alice Smith</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('driver')}
                disabled={loading}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-dark-800 hover:bg-dark-700/80 border border-emerald-500/30 text-slate-200 transition hover:scale-[1.02] cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-1 group-hover:bg-emerald-500 group-hover:text-dark-950 transition">
                  <Car className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-white">Driver</span>
                <span className="text-[9px] text-slate-400">John Doe</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('admin')}
                disabled={loading}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-dark-800 hover:bg-dark-700/80 border border-red-500/30 text-slate-200 transition hover:scale-[1.02] cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center mb-1 group-hover:bg-red-500 group-hover:text-white transition">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-white">Admin</span>
                <span className="text-[9px] text-slate-400">Marcus Vance</span>
              </button>
            </div>
          </div>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-dark-900 px-2 text-slate-500 font-semibold">Or sign in with email</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-dark-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-dark-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-950 font-bold text-xs transition shadow-lg shadow-brand-500/20 flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to RYDO'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onNavigateToRegister}
                className="font-bold text-brand-400 hover:text-brand-300 transition cursor-pointer"
              >
                Create an account
              </button>
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};
