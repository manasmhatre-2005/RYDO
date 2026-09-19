import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { apiClient } from '../../api/client';
import { LiveMap } from '../../components/map/LiveMap';
import { RideStatusBadge } from '../../components/RideStatusBadge';
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
  Sliders
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { subscribe } = useSocket();

  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [pricing, setPricing] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<'overview' | 'drivers' | 'rides' | 'pricing'>('overview');
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, driversRes, ridesRes, usersRes, pricingRes] = await Promise.all([
        apiClient.get<AdminAnalytics>('/admin/analytics'),
        apiClient.get<any[]>('/admin/drivers'),
        apiClient.get<Ride[]>('/admin/rides'),
        apiClient.get<any[]>('/admin/users'),
        apiClient.get<any>('/admin/pricing-config'),
      ]);

      setAnalytics(analyticsRes.data);
      setDrivers(driversRes.data);
      setRides(ridesRes.data);
      setUsersList(usersRes.data);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-wider">
              Control Center
            </span>
            <span className="text-xs text-slate-500">• Real-Time Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">RYDO Admin Portal</h1>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-dark-900 border border-slate-800 rounded-2xl p-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-brand-500 text-dark-950 shadow-md shadow-brand-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Overview & Ops Map
          </button>
          <button
            onClick={() => setActiveTab('drivers')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'drivers'
                ? 'bg-brand-500 text-dark-950 shadow-md shadow-brand-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Drivers ({drivers.length})
          </button>
          <button
            onClick={() => setActiveTab('rides')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'rides'
                ? 'bg-brand-500 text-dark-950 shadow-md shadow-brand-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Ride Audit ({rides.length})
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'pricing'
                ? 'bg-brand-500 text-dark-950 shadow-md shadow-brand-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pricing Engine
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Volume */}
        <div className="p-5 rounded-2xl bg-dark-900 border border-slate-800 shadow-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Gross Platform GMV</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            ${analytics?.total_gmv?.toFixed(2) || '0.00'}
          </div>
          <span className="text-[10px] text-emerald-400 font-semibold">Total processed volume</span>
        </div>

        {/* RYDO Net Revenue */}
        <div className="p-5 rounded-2xl bg-dark-900 border border-slate-800 shadow-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Net Platform Revenue (20%)</span>
            <TrendingUp className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-brand-400">
            ${analytics?.total_platform_revenue?.toFixed(2) || '0.00'}
          </div>
          <span className="text-[10px] text-brand-400 font-semibold">RYDO platform margin</span>
        </div>

        {/* Active Rides */}
        <div className="p-5 rounded-2xl bg-dark-900 border border-slate-800 shadow-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active Rides</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {analytics?.active_rides || 0}
          </div>
          <span className="text-[10px] text-blue-400 font-semibold">
            {analytics?.completed_rides || 0} completed • {analytics?.cancelled_rides || 0} cancelled
          </span>
        </div>

        {/* Online Drivers */}
        <div className="p-5 rounded-2xl bg-dark-900 border border-slate-800 shadow-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Fleet Availability</span>
            <Car className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {analytics?.online_drivers || 0} / {analytics?.total_drivers || 0}
          </div>
          <span className="text-[10px] text-purple-400 font-semibold">Drivers active & online</span>
        </div>
      </div>

      {/* Tab: Overview & Operations Map */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-dark-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-white text-base">Live Fleet & Operations Map</h3>
                <p className="text-xs text-slate-400">Real-time telemetry of online drivers and active passenger trips.</p>
              </div>
              <button
                onClick={fetchAdminData}
                className="p-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-white transition"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <LiveMap
              nearbyDrivers={onlineDriverMarkers}
              className="h-[460px] w-full rounded-2xl overflow-hidden border border-slate-800"
            />
          </div>

          {/* Quick Active Trips Table */}
          <div className="bg-dark-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-white text-base">Recent Platform Activity</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="pb-3">Ride ID</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Passenger</th>
                    <th className="pb-3">Driver</th>
                    <th className="pb-3">Tier</th>
                    <th className="pb-3">Fare</th>
                    <th className="pb-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {rides.slice(0, 5).map((ride) => (
                    <tr key={ride.id} className="hover:bg-dark-800/40">
                      <td className="py-3 font-mono font-bold text-slate-200">#{ride.id}</td>
                      <td className="py-3"><RideStatusBadge status={ride.status} /></td>
                      <td className="py-3 text-slate-300">{ride.passenger?.full_name || `User #${ride.passenger_id}`}</td>
                      <td className="py-3 text-slate-300">{ride.driver?.full_name || 'Unassigned'}</td>
                      <td className="py-3 font-semibold text-brand-400">{ride.vehicle_type}</td>
                      <td className="py-3 font-bold text-white">${(ride.final_fare || ride.estimated_fare).toFixed(2)}</td>
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
      {activeTab === 'drivers' && (
        <div className="bg-dark-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-white text-base">Registered Drivers Roster</h3>
            <span className="text-xs text-slate-400">{drivers.length} drivers registered</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
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
              <tbody className="divide-y divide-slate-800/60">
                {drivers.map((d) => (
                  <tr key={d.id} className="hover:bg-dark-800/40">
                    <td className="py-3">
                      <div className="font-bold text-white">{d.full_name}</div>
                      <div className="text-[10px] text-slate-400">{d.email}</div>
                    </td>
                    <td className="py-3 text-slate-300">
                      {d.vehicle_color} {d.vehicle_make} {d.vehicle_model} ({d.vehicle_year})
                    </td>
                    <td className="py-3 font-mono text-brand-400">{d.license_plate}</td>
                    <td className="py-3 font-bold">{d.vehicle_type}</td>
                    <td className="py-3 text-slate-300">{d.total_trips}</td>
                    <td className="py-3 text-brand-400 font-bold">★ {d.rating.toFixed(1)}</td>
                    <td className="py-3 font-bold text-emerald-400">${d.total_earnings.toFixed(2)}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        d.is_verified ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {d.is_verified ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleToggleVerification(d.id, d.is_verified)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                          d.is_verified
                            ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white'
                            : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-dark-950'
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
      {activeTab === 'rides' && (
        <div className="bg-dark-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-extrabold text-white text-base">Complete Ride Ledger & Financial Settlement</h3>
            
            {/* Status Filter */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-500">Filter:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-dark-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
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
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="pb-3">Ride ID</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Route (Pickup → Dropoff)</th>
                  <th className="pb-3">Passenger</th>
                  <th className="pb-3">Driver</th>
                  <th className="pb-3">Distance / Duration</th>
                  <th className="pb-3">Gross Fare</th>
                  <th className="pb-3">Platform Cut (20%)</th>
                  <th className="pb-3">Transaction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRides.map((ride) => (
                  <tr key={ride.id} className="hover:bg-dark-800/40">
                    <td className="py-3 font-mono font-bold text-white">#{ride.id}</td>
                    <td className="py-3"><RideStatusBadge status={ride.status} /></td>
                    <td className="py-3 text-slate-300 max-w-xs truncate">
                      <div className="truncate font-medium">{ride.pickup_address}</div>
                      <div className="truncate text-slate-500 text-[10px]">→ {ride.dropoff_address}</div>
                    </td>
                    <td className="py-3 text-slate-300">{ride.passenger?.full_name || `#${ride.passenger_id}`}</td>
                    <td className="py-3 text-slate-300">{ride.driver?.full_name || '—'}</td>
                    <td className="py-3 text-slate-400">{ride.distance_km} km • {ride.duration_minutes} min</td>
                    <td className="py-3 font-black text-white">${(ride.final_fare || ride.estimated_fare).toFixed(2)}</td>
                    <td className="py-3 font-bold text-brand-400">
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
      {activeTab === 'pricing' && pricing && (
        <div className="bg-dark-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="space-y-1">
            <h3 className="font-extrabold text-white text-base">Global Dynamic Pricing Engine</h3>
            <p className="text-xs text-slate-400">Platform rate matrix across all 4 ride tiers and platform take-rate.</p>
          </div>

          <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">RYDO Platform Commission Take-Rate</span>
              <div className="text-2xl font-black text-white mt-0.5">{pricing.commission_percent}%</div>
              <p className="text-[11px] text-slate-400">Driver receives 80%, platform retains 20% on every completed trip.</p>
            </div>
            <Sliders className="w-8 h-8 text-brand-400" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(pricing.tiers).map(([tierKey, rates]: [string, any]) => (
              <div key={tierKey} className="p-4 rounded-2xl bg-dark-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h4 className="font-bold text-white text-sm">RYDO {tierKey}</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-dark-800 text-slate-300 font-mono">Tier</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Base Fare:</span>
                    <span className="font-bold text-white">${rates.base.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Rate / km:</span>
                    <span className="font-bold text-white">${rates.per_km.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Rate / minute:</span>
                    <span className="font-bold text-white">${rates.per_min.toFixed(2)}</span>
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
