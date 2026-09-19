import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Car, User, ArrowRight, Lock, Mail, Phone, UserCheck, AlertCircle, Sparkles } from 'lucide-react';

interface RegisterProps {
  onNavigateToLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onNavigateToLogin }) => {
  const { register } = useAuth();
  const [role, setRole] = useState<'passenger' | 'driver'>('passenger');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Driver specific fields
  const [vehicleMake, setVehicleMake] = useState('Toyota');
  const [vehicleModel, setVehicleModel] = useState('Camry');
  const [vehicleYear, setVehicleYear] = useState(2023);
  const [licensePlate, setLicensePlate] = useState('');
  const [vehicleType, setVehicleType] = useState('GO');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload: any = {
        email,
        password,
        full_name: fullName,
        phone,
        role
      };

      if (role === 'driver') {
        payload.vehicle_make = vehicleMake;
        payload.vehicle_model = vehicleModel;
        payload.vehicle_year = Number(vehicleYear);
        payload.license_plate = licensePlate || `RYDO-${Math.floor(1000 + Math.random() * 9000)}`;
        payload.vehicle_type = vehicleType;
      }

      await register(payload);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pearl-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background soft pearl reflections */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-electric-50/80 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-cyan-50/70 rounded-full blur-[140px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sm:mx-auto sm:w-full sm:max-w-lg z-10"
      >
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-3">
            <img src="/brand/logo.svg" alt="RYDO" className="h-11 w-auto object-contain" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-navy-900">Create RYDO Account</h1>
          <p className="mt-1 text-xs text-slate-500 font-semibold tracking-wide">
            Move Smarter. Ride Better.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-2xl py-8 px-6 sm:px-8 border border-slate-200/80 rounded-3xl shadow-luxury-lg">
          
          {/* Role selector tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-pearl-100 rounded-2xl border border-slate-200 mb-6">
            <button
              type="button"
              onClick={() => setRole('passenger')}
              className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
                role === 'passenger'
                  ? 'bg-electric-500 text-white shadow-md shadow-electric-500/20'
                  : 'text-slate-500 hover:text-navy-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Ride as Passenger</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('driver')}
              className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
                role === 'driver'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-500 hover:text-navy-900'
              }`}
            >
              <Car className="w-4 h-4" />
              <span>Drive with RYDO</span>
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-navy-900 mb-1">Full Name</label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full bg-pearl-100/70 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-navy-900 placeholder-slate-400 focus:outline-none focus:border-electric-500 focus:bg-white transition shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-900 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full bg-pearl-100/70 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-navy-900 placeholder-slate-400 focus:outline-none focus:border-electric-500 focus:bg-white transition shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-900 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
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
                  placeholder="Minimum 6 characters"
                  className="w-full bg-pearl-100/70 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-navy-900 placeholder-slate-400 focus:outline-none focus:border-electric-500 focus:bg-white transition shadow-sm"
                />
              </div>
            </div>

            {/* Vehicle Details for Drivers */}
            {role === 'driver' && (
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <div className="text-xs font-black text-emerald-600 uppercase tracking-wider flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Vehicle Fleet Information</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Make</label>
                    <input
                      type="text"
                      required
                      value={vehicleMake}
                      onChange={(e) => setVehicleMake(e.target.value)}
                      placeholder="e.g. Toyota"
                      className="w-full bg-pearl-100/70 border border-slate-200 rounded-xl px-3 py-2 text-xs text-navy-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Model</label>
                    <input
                      type="text"
                      required
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      placeholder="e.g. Camry"
                      className="w-full bg-pearl-100/70 border border-slate-200 rounded-xl px-3 py-2 text-xs text-navy-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Year</label>
                    <input
                      type="number"
                      required
                      value={vehicleYear}
                      onChange={(e) => setVehicleYear(Number(e.target.value))}
                      className="w-full bg-pearl-100/70 border border-slate-200 rounded-xl px-3 py-2 text-xs text-navy-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">License Plate</label>
                    <input
                      type="text"
                      required
                      value={licensePlate}
                      onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                      placeholder="e.g. RYDO-5511"
                      className="w-full bg-pearl-100/70 border border-slate-200 rounded-xl px-3 py-2 text-xs text-navy-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Ride Tier Category</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full bg-pearl-100/70 border border-slate-200 rounded-xl px-3 py-2 text-xs text-navy-900 font-medium focus:outline-none focus:border-emerald-500 focus:bg-white"
                  >
                    <option value="GO">RYDO Go (Economy Sedan)</option>
                    <option value="COMFORT">RYDO Comfort (Spacious Sedan)</option>
                    <option value="XL">RYDO XL (SUV / 6 seats)</option>
                    <option value="PREMIUM">RYDO Premium (Luxury Chauffeur)</option>
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 rounded-2xl bg-gradient-to-tr from-electric-600 to-electric-500 hover:from-electric-500 hover:to-electric-400 text-white font-black text-xs transition shadow-md shadow-electric-500/25 flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              Already registered?{' '}
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="font-bold text-electric-600 hover:underline cursor-pointer"
              >
                Sign in here
              </button>
            </p>
          </div>

        </div>
      </motion.div>
    </div>
  );
};
