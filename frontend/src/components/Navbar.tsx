import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Role } from '../types';
import { 
  Car, 
  ShieldCheck, 
  User as UserIcon, 
  LogOut, 
  Radio, 
  ChevronDown, 
  Sparkles
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, role, demoLogin, logout } = useAuth();
  const { isConnected } = useSocket();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const handleRoleSwitch = async (targetRole: Role) => {
    setIsSwitching(true);
    setIsMenuOpen(false);
    try {
      await demoLogin(targetRole);
    } finally {
      setIsSwitching(false);
    }
  };

  const getRoleBadge = (userRole: Role | null) => {
    switch (userRole) {
      case 'admin':
        return {
          label: 'Platform Admin',
          bg: 'bg-red-500/10 text-red-400 border-red-500/20',
          icon: <ShieldCheck className="w-3.5 h-3.5" />
        };
      case 'driver':
        return {
          label: 'RYDO Driver',
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          icon: <Car className="w-3.5 h-3.5" />
        };
      case 'passenger':
      default:
        return {
          label: 'Passenger',
          bg: 'bg-electric-500/10 text-electric-400 border-electric-500/20',
          icon: <UserIcon className="w-3.5 h-3.5" />
        };
    }
  };

  const badge = getRoleBadge(role);

  return (
    <header className="sticky top-0 z-50 bg-obsidian-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Tagline */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-electric-600 to-electric-400 flex items-center justify-center shadow-lg shadow-electric-500/25 font-black text-obsidian-950 text-xl tracking-tighter">
            R
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-extrabold tracking-tight text-white">RYDO</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-obsidian-850 text-electric-400 border border-slate-700">3D</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">Move Smarter. Ride Better.</p>
          </div>
        </div>

        {/* Live Network & User Controls */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          
          {/* WebSocket Status Indicator */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-obsidian-850 border border-slate-700/60 text-xs">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-cyan-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-slate-300 font-medium hidden md:inline">
              {isConnected ? 'Telemetry Live' : 'Connecting'}
            </span>
          </div>

          {/* Current Role Badge */}
          <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${badge.bg}`}>
            {badge.icon}
            <span className="capitalize">{badge.label}</span>
          </div>

          {/* Quick 1-Click Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              disabled={isSwitching}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-obsidian-850 hover:bg-obsidian-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-electric-400" />
              <span className="hidden sm:inline">Switch Demo Role</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-obsidian-850 rounded-xl shadow-2xl border border-slate-700 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-700/60 mb-1">
                  1-Click Role Switcher
                </div>

                <button
                  onClick={() => handleRoleSwitch('passenger')}
                  className={`w-full text-left px-3 py-2 flex items-center space-x-2.5 hover:bg-obsidian-800 text-xs font-medium ${role === 'passenger' ? 'text-electric-400 font-bold bg-electric-500/10' : 'text-slate-200'}`}
                >
                  <UserIcon className="w-4 h-4 text-electric-400" />
                  <div>
                    <div>Passenger View</div>
                    <div className="text-[10px] text-slate-400 font-normal">Alice Smith (Book & Ride)</div>
                  </div>
                </button>

                <button
                  onClick={() => handleRoleSwitch('driver')}
                  className={`w-full text-left px-3 py-2 flex items-center space-x-2.5 hover:bg-obsidian-800 text-xs font-medium ${role === 'driver' ? 'text-emerald-400 font-bold bg-emerald-500/10' : 'text-slate-200'}`}
                >
                  <Car className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div>Driver View</div>
                    <div className="text-[10px] text-slate-400 font-normal">John Doe (Accept & Drive)</div>
                  </div>
                </button>

                <button
                  onClick={() => handleRoleSwitch('admin')}
                  className={`w-full text-left px-3 py-2 flex items-center space-x-2.5 hover:bg-obsidian-800 text-xs font-medium ${role === 'admin' ? 'text-red-400 font-bold bg-red-500/10' : 'text-slate-200'}`}
                >
                  <ShieldCheck className="w-4 h-4 text-red-400" />
                  <div>
                    <div>Admin Operations</div>
                    <div className="text-[10px] text-slate-400 font-normal">Marcus Vance (Ops & Revenue)</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="w-8 h-8 rounded-full border border-slate-700 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-obsidian-850 flex items-center justify-center text-xs font-bold text-slate-300">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
            )}

            <button
              onClick={logout}
              title="Log Out"
              className="p-1.5 rounded-lg hover:bg-obsidian-850 text-slate-400 hover:text-rose-400 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};
