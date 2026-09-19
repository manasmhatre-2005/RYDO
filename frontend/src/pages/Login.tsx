import React, { useState, Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import { Car, ShieldCheck, User, Sparkles, ArrowRight, Lock, Mail, AlertCircle, Compass, CheckCircle2 } from 'lucide-react';

const VehiclePreviewCanvas = lazy(() => import('../components/3d/VehiclePreviewCanvas'));

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
    <div className="min-h-screen bg-pearl-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background soft pearl reflections */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-electric-50/80 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-cyan-50/70 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
        
        {/* LEFT / CENTER: HERO 3D EXPERIENCE */}
        <motion.div 
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-7 space-y-6"
        >
          {/* Brand Emblem */}
          <div className="flex items-center space-x-3">
            <img src="/brand/logo.svg" alt="RYDO" className="h-12 w-auto object-contain" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-electric-50 border border-electric-200 text-electric-600 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Generation Mobility Platform</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-navy-900 leading-[1.15]">
              Move Smarter. <br />
              <span className="text-electric-500">Ride Better.</span>
            </h1>
            <p className="text-slate-500 text-sm sm:text-base max-w-lg leading-relaxed pt-1">
              Precision algorithmic ride matching, real-time 3D vehicle telemetry, and zero-compromise passenger safety.
            </p>
          </div>

          {/* HERO 3D VEHICLE STAGE */}
          <div className="rounded-3xl overflow-hidden shadow-luxury-lg border border-slate-200/80 bg-white p-2">
            <Suspense fallback={<div className="h-60 w-full bg-pearl-200 animate-pulse rounded-2xl" />}>
              <VehiclePreviewCanvas vehicleType="PREMIUM" className="h-64 sm:h-72 w-full rounded-2xl" />
            </Suspense>
          </div>

          {/* Key Value Points */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-white border border-slate-200/70 shadow-sm text-center">
              <div className="text-xs font-black text-navy-900">4 Mobility Tiers</div>
              <div className="text-[10px] text-slate-400 font-medium">Go, Comfort, XL, VIP</div>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-slate-200/70 shadow-sm text-center">
              <div className="text-xs font-black text-navy-900">4-Digit Security PIN</div>
              <div className="text-[10px] text-slate-400 font-medium">Verified trip start</div>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-slate-200/70 shadow-sm text-center">
              <div className="text-xs font-black text-navy-900">RYDO AI Concierge</div>
              <div className="text-[10px] text-slate-400 font-medium">Instant route pricing</div>
            </div>
          </div>
        </motion.div>

        {/* RIGHT: LOGIN CARD */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="lg:col-span-5"
        >
          <div className="bg-white/95 backdrop-blur-2xl py-8 px-6 sm:px-8 border border-slate-200/80 rounded-3xl shadow-luxury-lg space-y-6">
            
            <div>
              <h2 className="text-2xl font-black tracking-tight text-navy-900">Sign in to RYDO</h2>
              <p className="text-xs text-slate-500 mt-1">Access your Passenger, Driver, or Admin portal</p>
            </div>

            {/* 1-Click Demo Accounts Bar */}
            <div className="space-y-2">
              <div className="flex items-center space-x-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                <Sparkles className="w-3 h-3 text-electric-500" />
                <span>Instant 1-Click Demo Logins</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('passenger')}
                  disabled={loading}
                  className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-pearl-100 hover:bg-electric-50 border border-slate-200 hover:border-electric-300 text-navy-900 transition hover:scale-[1.02] cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-xl bg-electric-500 text-white flex items-center justify-center mb-1 shadow-sm">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-extrabold">Passenger</span>
                  <span className="text-[9px] text-slate-400">Alice Smith</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('driver')}
                  disabled={loading}
                  className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-pearl-100 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-navy-900 transition hover:scale-[1.02] cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-xl bg-emerald-500 text-white flex items-center justify-center mb-1 shadow-sm">
                    <Car className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-extrabold">Driver</span>
                  <span className="text-[9px] text-slate-400">John Doe</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('admin')}
                  disabled={loading}
                  className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-pearl-100 hover:bg-red-50 border border-slate-200 hover:border-red-300 text-navy-900 transition hover:scale-[1.02] cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-xl bg-navy-900 text-white flex items-center justify-center mb-1 shadow-sm">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-extrabold">Admin</span>
                  <span className="text-[9px] text-slate-400">Marcus Vance</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400">
                <span className="bg-white px-2">Or enter credentials</span>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-pearl-100/70 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-navy-900 placeholder-slate-400 focus:outline-none focus:border-electric-500 focus:bg-white transition shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-pearl-100/70 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-navy-900 placeholder-slate-400 focus:outline-none focus:border-electric-500 focus:bg-white transition shadow-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-tr from-electric-600 to-electric-500 hover:from-electric-500 hover:to-electric-400 text-white font-black text-xs transition shadow-md shadow-electric-500/25 flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to RYDO'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-2 text-center">
              <p className="text-xs text-slate-500">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={onNavigateToRegister}
                  className="font-bold text-electric-600 hover:underline cursor-pointer"
                >
                  Create account
                </button>
              </p>
            </div>

          </div>
        </motion.div>

      </div>

    </div>
  );
};
