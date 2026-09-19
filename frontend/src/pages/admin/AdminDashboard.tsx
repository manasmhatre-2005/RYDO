import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { apiClient } from '../../api/client';
import { LiveMap } from '../../components/map/LiveMap';
import { RideStatusBadge } from '../../components/RideStatusBadge';
import { RydoAIAssistant } from '../../components/ai/RydoAIAssistant';
import { AdminAnalytics, Ride } from '../../types';
import { 
  ShieldCheck, 
  TrendingUp, 
  DollarSign, 
  Car, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Search, 
  RefreshCw,
  FileText,
  Sliders,
  Sparkles
} from 'lucide-react';

interface AdminDashboardProps {
  currentTab?: string;
  onTabChange?: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentTab = 'overview',
  onTabChange
}) => {
  const { user } = useAuth();
  const { subscribe } = useSocket();

  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [pricing, setPricing] = useState<any>(null);

  const [internalTab, setInternalTab] = useState<'overview' | 'drivers' | 'rides' | 'pricing'>('overview');
  const effectiveTab = currentTab || internalTab;

  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const handleTabSwitch = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalTab(tab as any);
    }
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, driversRes, ridesRes, pricingRes] = await Promise.all([
        apiClient.get<AdminAnalytics>('/admin/analytics'),
        apiClient.get<any[]>('/admin/drivers'),
        apiClient.get<Ride[]>('/admin/rides'),
        apiClient.get<any>('/admin/pricing-config'),
      ]);

      setAnalytics(analyticsRes.data);
      setDrivers(driversRes.data);
      setRides(ridesRes.data);
      setPricing(pricingRes.data);
    } catch (err) {
      console.error('Failed to load admin telemetry', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Listen to platform events to keep admin dashboard fresh
  useEffect(() => {
    const unsub = subscribe('*', () => {
      fetchAdminData();
    });
    return () => unsub();
  }, [subscribe]);

  const handleToggleVerification = async (driverId: number, currentStatus: boolean) => {
    try {
      await apiClient.post(`/admin/drivers/${driverId}/verify`, {
        is_verified: !currentStatus,
      });
      fetchAdminData();
    } catch (e) {
      alert('Failed to update driver status');
    }
  };

  const filteredRides = statusFilter === 'ALL'
    ? rides
    : rides.filter(r => r.status === statusFilter);

  // Active drivers for map display
  const onlineDriverMarkers = drivers
    .filter(d => d.is_online && d.current_lat && d.current_lng)
    .map(d => ({
      id: d.id,
      lat: d.current_lat,
      lng: d.current_lng,
      vehicle_type: d.vehicle_type
    }));

  return (
    <div className="space-y-6">
      
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-600 border border-rose-200 uppercase tracking-wider">
              Control Center
            </span>
            <span className="text-xs text-slate-400 font-semibold">• Real-Time Operations Telemetry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-900 mt-1">RYDO Admin Portal</h1>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-pearl-100 border border-slate-200 rounded-2xl p-1 overflow-x-auto shadow-sm">
          <button
            onClick={() => handleTabSwitch('overview')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              effectiveTab === 'overview'
                ? 'bg-white text-navy-900 shadow-sm border border-slate-200/80'
                : 'text-slate-500 hover:text-navy-900'
            }`}
          >
            Overview & Ops Map
          </button>
          <button
            onClick={() => handleTabSwitch('drivers')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              effectiveTab === 'drivers'
                ? 'bg-white text-navy-900 shadow-sm border border-slate-200/80'
                : 'text-slate-500 hover:text-navy-900'
            }`}
          >
            Drivers ({drivers.length})
          </button>
          <button
            onClick={() => handleTabSwitch('rides')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              effectiveTab === 'rides'
                ? 'bg-white text-navy-900 shadow-sm border border-slate-200/80'
                : 'text-slate-500 hover:text-navy-900'
            }`}
          >
            Ride Audit ({rides.length})
          </button>
          <button
            onClick={() => handleTabSwitch('pricing')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              effectiveTab === 'pricing'
                ? 'bg-white text-navy-900 shadow-sm border border-slate-200/80'
                : 'text-slate-500 hover:text-navy-900'
            }`}
          >
            Pricing Engine
          </button>
          <button
            onClick={() => handleTabSwitch('ai')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              effectiveTab === 'ai'
                ? 'bg-white text-navy-900 shadow-sm border border-slate-200/80'
                : 'text-slate-500 hover:text-navy-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 inline mr-1 text-amber-500" />
            Ops AI
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Volume */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-luxury space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Gross Platform GMV</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-navy-900">
            ${analytics?.total_gmv?.toFixed(2) || '0.00'}
          </div>
          <span className="text-[10px] text-emerald-600 font-bold">Total processed bookings</span>
        </div>

        {/* RYDO Net Revenue */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-luxury space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Platform Revenue (20%)</span>
            <TrendingUp className="w-4 h-4 text-electric-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-electric-600">
            ${analytics?.total_platform_revenue?.toFixed(2) || '0.00'}
          </div>
          <span className="text-[10px] text-electric-600 font-bold">RYDO platform take-rate</span>
        </div>

        {/* Active Rides */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-luxury space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Active Rides</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-navy-900">
            {analytics?.active_rides || 0}
          </div>
          <span className="text-[10px] text-blue-600 font-semibold">
            {analytics?.completed_rides || 0} completed • {analytics?.cancelled_rides || 0} cancelled
          </span>
        </div>

        {/* Online Drivers */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-luxury space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Fleet Availability</span>
            <Car className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-navy-900">
            {analytics?.online_drivers || 0} / {analytics?.total_drivers || 0}
          </div>
          <span className="text-[10px] text-indigo-600 font-semibold">Drivers active & online</span>
        </div>
      </div>

      {/* Tab: RYDO AI OPS */}
      {effectiveTab === 'ai' && (
        <RydoAIAssistant />
      )}

      {/* Tab: Overview & Operations Map */}
      {effectiveTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-luxury-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-navy-900 text-base">Live Fleet & Operations Map</h3>
                <p className="text-xs text-slate-500">Real-time telemetry of online drivers and active passenger trips across San Francisco.</p>
              </div>
              <button
                onClick={fetchAdminData}
                className="p-2 rounded-xl bg-pearl-100 hover:bg-pearl-200 text-navy-900 transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <LiveMap
              nearbyDrivers={onlineDriverMarkers}
              className="h-[460px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner"
            />
          </div>

          {/* Quick Active Trips Table */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-luxury-lg space-y-4">
            <h3 className="font-black text-navy-900 text-base">Recent Platform Activity</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="pb-3">Ride ID</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Passenger</th>
                    <th className="pb-3">Driver</th>
                    <th className="pb-3">Tier</th>
                    <th className="pb-3">Gross Fare</th>
                    <th className="pb-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rides.slice(0, 5).map((ride) => (
                    <tr key={ride.id} className="hover:bg-pearl-50/70 transition">
                      <td className="py-3 font-mono font-bold text-navy-900">#{ride.id}</td>
                      <td className="py-3"><RideStatusBadge status={ride.status} /></td>
                      <td className="py-3 text-navy-900 font-semibold">{ride.passenger?.full_name || `User #${ride.passenger_id}`}</td>
                      <td className="py-3 text-slate-600">{ride.driver?.full_name || 'Unassigned'}</td>
                      <td className="py-3 font-black text-electric-600">RYDO {ride.vehicle_type}</td>
                      <td className="py-3 font-black text-navy-900">${(ride.final_fare || ride.estimated_fare).toFixed(2)}</td>
                      <td className="py-3 text-slate-400">{new Date(ride.created_at).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Drivers Management */}
      {effectiveTab === 'drivers' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-luxury-lg space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h3 className="font-black text-navy-900 text-base">Registered Drivers Roster</h3>
              <p className="text-xs text-slate-500">Review driver credentials, vehicle models, and toggle verification status.</p>
            </div>
            <span className="text-xs font-bold text-slate-400">{drivers.length} drivers registered</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3">Driver</th>
                  <th className="pb-3">Vehicle</th>
                  <th className="pb-3">Plate</th>
                  <th className="pb-3">Tier</th>
                  <th className="pb-3">Trips</th>
                  <th className="pb-3">Rating</th>
                  <th className="pb-3">Total Earned</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {drivers.map((d) => (
                  <tr key={d.id} className="hover:bg-pearl-50/70 transition">
                    <td className="py-3">
                      <div className="font-bold text-navy-900">{d.full_name}</div>
                      <div className="text-[10px] text-slate-400">{d.email}</div>
                    </td>
                    <td className="py-3 text-slate-600">
                      {d.vehicle_color} {d.vehicle_make} {d.vehicle_model} ({d.vehicle_year})
                    </td>
                    <td className="py-3 font-mono font-bold text-electric-600">{d.license_plate}</td>
                    <td className="py-3 font-bold text-navy-900">{d.vehicle_type}</td>
                    <td className="py-3 text-slate-600 font-semibold">{d.total_trips}</td>
                    <td className="py-3 text-amber-500 font-bold">★ {d.rating.toFixed(1)}</td>
                    <td className="py-3 font-black text-emerald-600">${d.total_earnings.toFixed(2)}</td>
                    <td className="py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                        d.is_verified 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                          : 'bg-amber-50 text-amber-600 border border-amber-200'
                      }`}>
                        {d.is_verified ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleToggleVerification(d.id, d.is_verified)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                          d.is_verified
                            ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        {d.is_verified ? 'Revoke' : 'Approve'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Rides Audit */}
      {effectiveTab === 'rides' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-luxury-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <h3 className="font-black text-navy-900 text-base">Complete Ride Ledger & Financial Settlement</h3>
              <p className="text-xs text-slate-500">Auditable trace of every request, pickup coordinates, driver assignment, and transaction ID.</p>
            </div>
            
            {/* Status Filter */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-400 font-bold">Filter:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-pearl-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-navy-900 font-semibold focus:outline-none focus:border-electric-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="ACCEPTED">Accepted</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3">Ride ID</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Route (Pickup → Dropoff)</th>
                  <th className="pb-3">Passenger</th>
                  <th className="pb-3">Driver</th>
                  <th className="pb-3">Distance / Duration</th>
                  <th className="pb-3">Gross Fare</th>
                  <th className="pb-3">Platform Take (20%)</th>
                  <th className="pb-3">Transaction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRides.map((ride) => (
                  <tr key={ride.id} className="hover:bg-pearl-50/70 transition">
                    <td className="py-3 font-mono font-bold text-navy-900">#{ride.id}</td>
                    <td className="py-3"><RideStatusBadge status={ride.status} /></td>
                    <td className="py-3 text-navy-900 max-w-xs truncate">
                      <div className="truncate font-semibold">{ride.pickup_address}</div>
                      <div className="truncate text-slate-400 text-[10px]">→ {ride.dropoff_address}</div>
                    </td>
                    <td className="py-3 text-navy-900 font-medium">{ride.passenger?.full_name || `#${ride.passenger_id}`}</td>
                    <td className="py-3 text-slate-600">{ride.driver?.full_name || '—'}</td>
                    <td className="py-3 text-slate-500">{ride.distance_km} km • {ride.duration_minutes} min</td>
                    <td className="py-3 font-black text-navy-900">${(ride.final_fare || ride.estimated_fare).toFixed(2)}</td>
                    <td className="py-3 font-black text-electric-600">
                      ${((ride.final_fare || ride.estimated_fare) * 0.20).toFixed(2)}
                    </td>
                    <td className="py-3 font-mono text-[10px] text-slate-400">
                      {ride.payment?.transaction_id || 'Pending'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Pricing Engine Configuration */}
      {effectiveTab === 'pricing' && pricing && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-luxury-lg space-y-6">
          <div className="space-y-1">
            <h3 className="font-black text-navy-900 text-base">Global Dynamic Pricing Engine Matrix</h3>
            <p className="text-xs text-slate-500">Autonomous rate configuration across all 4 ride tiers and platform take-rate parameters.</p>
          </div>

          <div className="p-5 rounded-2xl bg-electric-50 border border-electric-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-electric-700 uppercase tracking-wider">
                RYDO Platform Commission Take-Rate
              </span>
              <div className="text-3xl font-black text-navy-900 mt-0.5">{pricing.commission_percent}%</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Driver receives 80%, platform retains 20% on every settled ride.</p>
            </div>
            <Sliders className="w-10 h-10 text-electric-500" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(pricing.tiers).map(([tierKey, rates]: [string, any]) => (
              <div key={tierKey} className="p-5 rounded-2xl bg-pearl-50/70 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="font-black text-navy-900 text-sm">RYDO {tierKey}</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-600 font-mono font-bold">
                    Tier
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Base Fare:</span>
                    <span className="font-bold text-navy-900">${rates.base.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Rate / km:</span>
                    <span className="font-bold text-navy-900">${rates.per_km.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Rate / minute:</span>
                    <span className="font-bold text-navy-900">${rates.per_min.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
