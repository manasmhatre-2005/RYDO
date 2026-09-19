import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { apiClient } from '../../api/client';
import { Role, NotificationItem } from '../../types';
import { 
  Navigation, 
  MapPin, 
  Clock, 
  History, 
  Bot, 
  ShieldCheck, 
  CreditCard, 
  Settings, 
  Car, 
  Users, 
  DollarSign, 
  Sliders, 
  Bell, 
  Search, 
  Sparkles, 
  ChevronDown, 
  LogOut, 
  CheckCheck,
  Compass,
  FileText
} from 'lucide-react';

interface AppShellProps {
  currentTab: string;
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ currentTab, onTabChange, children }) => {
  const { user, role, demoLogin, logout } = useAuth();
  const { isConnected } = useSocket();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get<NotificationItem[]>('/notifications');
      setNotifications(res.data);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllRead = async () => {
    try {
      await apiClient.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) {
      // ignore
    }
  };

  const handleRoleSwitch = async (targetRole: Role) => {
    setShowRoleMenu(false);
    await demoLogin(targetRole);
  };

  // Nav configuration per role
  const getNavItems = () => {
    if (role === 'driver') {
      return [
        { id: 'dashboard', label: 'Driver Dashboard', icon: <Car className="w-4 h-4" /> },
        { id: 'offers', label: 'Dispatch Offers', icon: <Clock className="w-4 h-4" /> },
        { id: 'active', label: 'Active Navigation', icon: <Navigation className="w-4 h-4" /> },
        { id: 'earnings', label: 'Payouts & Ledger', icon: <DollarSign className="w-4 h-4" /> },
        { id: 'ai', label: 'RYDO AI Driver Copilot', icon: <Bot className="w-4 h-4" /> },
      ];
    }
    if (role === 'admin') {
      return [
        { id: 'overview', label: 'Ops Map & Telemetry', icon: <Compass className="w-4 h-4" /> },
        { id: 'drivers', label: 'Driver Verification', icon: <ShieldCheck className="w-4 h-4" /> },
        { id: 'rides', label: 'Platform Ride Ledger', icon: <FileText className="w-4 h-4" /> },
        { id: 'pricing', label: 'Pricing Engine Matrix', icon: <Sliders className="w-4 h-4" /> },
        { id: 'ai', label: 'RYDO AI Ops Intelligence', icon: <Bot className="w-4 h-4" /> },
      ];
    }
    // Default: Passenger
    return [
      { id: 'dashboard', label: 'Overview', icon: <Compass className="w-4 h-4" /> },
      { id: 'book', label: 'Book Ride & 3D Fleet', icon: <Navigation className="w-4 h-4" /> },
      { id: 'active', label: 'Live Active Ride', icon: <MapPin className="w-4 h-4" /> },
      { id: 'history', label: 'Trip History', icon: <History className="w-4 h-4" /> },
      { id: 'ai', label: 'RYDO AI Concierge', icon: <Bot className="w-4 h-4" /> },
      { id: 'safety', label: 'Safety & Assistance', icon: <ShieldCheck className="w-4 h-4" /> },
    ];
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-navy-900 flex flex-col antialiased">
      
      {/* 1. TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 h-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img 
              src="/brand/logo.svg" 
              alt="RYDO" 
              className="h-9 w-auto object-contain cursor-pointer"
              onClick={() => onTabChange('dashboard')}
            />
          </div>

          {/* Center Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search destinations, hub codes, or trip IDs..."
                className="w-full bg-pearl-100/80 border border-slate-200/80 rounded-2xl pl-10 pr-4 py-2 text-xs text-navy-900 placeholder-slate-400 focus:outline-none focus:border-electric-500 focus:bg-white transition shadow-sm"
              />
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-3">
            
            {/* Realtime Live Network Beacon */}
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-pearl-100 border border-slate-200 text-xs font-semibold text-slate-600">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-electric-500 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-[11px] hidden sm:inline">
                {isConnected ? 'Telemetry Active' : 'Connecting'}
              </span>
            </div>

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-2xl bg-pearl-100 hover:bg-pearl-200 border border-slate-200/80 text-navy-700 transition relative cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-electric-500 text-white text-[9px] font-black flex items-center justify-center shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-3xl shadow-luxury-lg border border-slate-200/80 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
                    <h4 className="font-extrabold text-xs text-navy-900">Notifications</h4>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[10px] text-electric-600 font-bold hover:underline flex items-center space-x-1"
                      >
                        <CheckCheck className="w-3 h-3" />
                        <span>Mark all read</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 rounded-2xl border text-xs transition ${
                          n.is_read ? 'bg-pearl-50 border-slate-100 text-slate-500' : 'bg-electric-50/40 border-electric-100 text-navy-900 font-medium'
                        }`}
                      >
                        <div className="font-bold text-[11px] text-navy-900">{n.title}</div>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{n.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 1-Click Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-2xl bg-pearl-100 hover:bg-pearl-200 border border-slate-200 text-xs font-bold text-navy-800 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-electric-500" />
                <span className="capitalize text-[11px]">{role}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-3xl shadow-luxury-lg border border-slate-200/80 py-2 z-50">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                    Demo Role Switcher
                  </div>
                  <button
                    onClick={() => handleRoleSwitch('passenger')}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center space-x-2 hover:bg-pearl-100 ${role === 'passenger' ? 'text-electric-600 font-bold bg-electric-50/40' : 'text-navy-700'}`}
                  >
                    <Compass className="w-4 h-4 text-electric-500" />
                    <div>
                      <div>Passenger Portal</div>
                      <div className="text-[9px] text-slate-400">Alice Smith</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('driver')}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center space-x-2 hover:bg-pearl-100 ${role === 'driver' ? 'text-emerald-600 font-bold bg-emerald-50/40' : 'text-navy-700'}`}
                  >
                    <Car className="w-4 h-4 text-emerald-500" />
                    <div>
                      <div>Driver Portal</div>
                      <div className="text-[9px] text-slate-400">John Doe</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('admin')}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center space-x-2 hover:bg-pearl-100 ${role === 'admin' ? 'text-red-600 font-bold bg-red-50/40' : 'text-navy-700'}`}
                  >
                    <ShieldCheck className="w-4 h-4 text-red-500" />
                    <div>
                      <div>Admin Operations</div>
                      <div className="text-[9px] text-slate-400">Marcus Vance</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Profile Avatar & Logout */}
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <img
                src={user?.avatar_url || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"}
                alt={user?.full_name}
                className="w-8 h-8 rounded-full border border-slate-200 object-cover shadow-sm"
              />
              <button
                onClick={logout}
                title="Log Out"
                className="p-1.5 rounded-xl hover:bg-pearl-200 text-slate-400 hover:text-rose-500 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      </header>

      {/* 2. MAIN APPLICATION WORKSPACE WITH FLOATING SIDEBAR */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* FLOATING SIDEBAR (Desktop) */}
          <aside className="lg:col-span-3 bg-white border border-slate-200/80 rounded-3xl p-4 shadow-luxury space-y-2 sticky top-24">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {role === 'driver' ? 'Driver Navigation' : role === 'admin' ? 'Operations Control' : 'Passenger Services'}
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-tr from-electric-600 to-electric-500 text-white shadow-md shadow-electric-500/25'
                        : 'text-slate-600 hover:text-navy-900 hover:bg-pearl-100'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Bottom Support Callout */}
            <div className="pt-4 mt-4 border-t border-slate-100 px-3">
              <div className="p-3 rounded-2xl bg-pearl-100/70 border border-slate-200/60 text-center space-y-1">
                <span className="text-[10px] font-extrabold text-navy-900 block">RYDO Incident Support</span>
                <span className="text-[10px] text-slate-500 block">24/7 Dedicated Assistance</span>
                <a
                  href="tel:+18005557936"
                  className="text-[10px] font-bold text-electric-600 hover:underline block pt-1"
                >
                  1-800-RYDO-SAFE
                </a>
              </div>
            </div>
          </aside>

          {/* MAIN CONTENT AREA */}
          <main className="lg:col-span-9 space-y-6">
            {children}
          </main>

        </div>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-slate-200/80 bg-white py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-navy-900">RYDO</span>
            <span>—</span>
            <span>Move Smarter. Ride Better.</span>
          </div>
          <div className="text-[11px]">
            Luxury 3D Mobility Software Platform • Production Render Ready
          </div>
        </div>
      </footer>

    </div>
  );
};
