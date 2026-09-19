import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { apiClient } from '../../api/client';
import { LiveMap } from '../../components/map/LiveMap';
import { FareCard } from '../../components/FareCard';
import { RideStatusBadge } from '../../components/RideStatusBadge';
import { RatingModal } from '../../components/RatingModal';
import { SafetyModal } from '../../components/SafetyModal';
import { Ride, FareTierEstimate, FareEstimateResponse } from '../../types';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Shield, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  History, 
  Compass, 
  Phone, 
  Sparkles,
  ArrowRight,
  Car,
  RotateCw
} from 'lucide-react';

// Lazy load 3D Vehicle component for zero-blocking performance
const VehiclePreviewCanvas = lazy(() => import('../../components/3d/VehiclePreviewCanvas'));

const PRESET_HUBS = [
  { name: 'Union Square', address: 'Union Square, SF', lat: 37.7879, lng: -122.4074 },
  { name: 'SFO Airport', address: 'San Francisco Int Airport (SFO)', lat: 37.6213, lng: -122.3790 },
  { name: 'Salesforce Tower', address: '415 Mission St, SF', lat: 37.7897, lng: -122.3972 },
  { name: 'Fisherman\'s Wharf', address: 'Beach St & The Embarcadero, SF', lat: 37.8080, lng: -122.4177 },
  { name: 'Golden Gate Park', address: 'Golden Gate Park Music Concourse', lat: 37.7694, lng: -122.4862 },
];

export const PassengerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { subscribe } = useSocket();

  // Active Ride state
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [loadingActiveRide, setLoadingActiveRide] = useState(true);

  // Route & Booking state
  const [pickup, setPickup] = useState<{ lat: number; lng: number; address: string }>(PRESET_HUBS[0]);
  const [dropoff, setDropoff] = useState<{ lat: number; lng: number; address: string }>(PRESET_HUBS[2]);
  const [selectionMode, setSelectionMode] = useState<'pickup' | 'dropoff' | null>(null);

  // Fare Estimates
  const [estimates, setEstimates] = useState<FareEstimateResponse | null>(null);
  const [selectedTier, setSelectedTier] = useState<'GO' | 'COMFORT' | 'XL' | 'PREMIUM'>('GO');
  const [estimating, setEstimating] = useState(false);
  const [requestingRide, setRequestingRide] = useState(false);

  // Modals & UI
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [completedRideToRate, setCompletedRideToRate] = useState<Ride | null>(null);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of plans');
  const [rideHistory, setRideHistory] = useState<Ride[]>([]);
  const [activeTab, setActiveTab] = useState<'book' | 'history'>('book');

  // Simulated live driver coordinates
  const [liveDriverPos, setLiveDriverPos] = useState<{ lat: number; lng: number } | null>(null);

  // 1. Fetch Active Ride on load
  const fetchActiveRide = async () => {
    try {
      const res = await apiClient.get('/rides/active');
      if (res.data.active && res.data.ride) {
        setActiveRide(res.data.ride);
        if (res.data.ride.driver_current_lat && res.data.ride.driver_current_lng) {
          setLiveDriverPos({
            lat: res.data.ride.driver_current_lat,
            lng: res.data.ride.driver_current_lng
          });
        }
      } else {
        setActiveRide(null);
      }
    } catch (e) {
      console.error('Failed to load active ride', e);
    } finally {
      setLoadingActiveRide(false);
    }
  };

  // 2. Fetch Fare Estimates whenever pickup or dropoff changes
  const fetchEstimates = async () => {
    if (!pickup || !dropoff) return;
    setEstimating(true);
    try {
      const res = await apiClient.post<FareEstimateResponse>('/rides/estimate', {
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        dropoff_lat: dropoff.lat,
        dropoff_lng: dropoff.lng
      });
      setEstimates(res.data);
    } catch (e) {
      console.error('Fare estimate error', e);
    } finally {
      setEstimating(false);
    }
  };

  // 3. Fetch History
  const fetchHistory = async () => {
    try {
      const res = await apiClient.get<Ride[]>('/rides/history');
      setRideHistory(res.data);
    } catch (e) {
      console.error('Failed to fetch history', e);
    }
  };

  useEffect(() => {
    fetchActiveRide();
    fetchEstimates();
    fetchHistory();
  }, []);

  useEffect(() => {
    if (!activeRide) {
      fetchEstimates();
    }
  }, [pickup.lat, pickup.lng, dropoff.lat, dropoff.lng]);

  // 4. Real-time WebSocket subscriptions
  useEffect(() => {
    const unsubAccepted = subscribe('RIDE_ACCEPTED', (data) => {
      setActiveRide(data.ride);
      if (data.ride?.driver_current_lat) {
        setLiveDriverPos({ lat: data.ride.driver_current_lat, lng: data.ride.driver_current_lng });
      }
    });

    const unsubArrived = subscribe('DRIVER_ARRIVED', (data) => {
      setActiveRide(data.ride);
    });

    const unsubStarted = subscribe('RIDE_STARTED', (data) => {
      setActiveRide(data.ride);
    });

    const unsubCompleted = subscribe('RIDE_COMPLETED', (data) => {
      setCompletedRideToRate(data.ride);
      setActiveRide(null);
      setShowRatingModal(true);
      fetchHistory();
    });

    const unsubCancelled = subscribe('RIDE_CANCELLED', (data) => {
      setActiveRide(null);
      fetchHistory();
    });

    const unsubLocation = subscribe('DRIVER_LOCATION_UPDATE', (data) => {
      if (data.lat && data.lng) {
        setLiveDriverPos({ lat: data.lat, lng: data.lng });
      }
    });

    return () => {
      unsubAccepted();
      unsubArrived();
      unsubStarted();
      unsubCompleted();
      unsubCancelled();
      unsubLocation();
    };
  }, [subscribe]);

  // Map Click handler
  const handleMapLocationSelect = (coords: { lat: number; lng: number }) => {
    const addr = `Custom Location (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`;
    if (selectionMode === 'pickup') {
      setPickup({ ...coords, address: addr });
      setSelectionMode(null);
    } else if (selectionMode === 'dropoff') {
      setDropoff({ ...coords, address: addr });
      setSelectionMode(null);
    }
  };

  // Request Ride
  const handleRequestRide = async () => {
    setRequestingRide(true);
    try {
      const res = await apiClient.post('/rides/request', {
        pickup_address: pickup.address,
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        dropoff_address: dropoff.address,
        dropoff_lat: dropoff.lat,
        dropoff_lng: dropoff.lng,
        vehicle_type: selectedTier,
        payment_method: 'CARD'
      });
      setActiveRide(res.data);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to request ride');
    } finally {
      setRequestingRide(false);
    }
  };

  // Cancel Ride
  const handleCancelRide = async () => {
    if (!activeRide) return;
    try {
      await apiClient.post(`/rides/cancel/${activeRide.id}`, { reason: cancelReason });
      setActiveRide(null);
      setShowCancelModal(false);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to cancel ride');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center space-x-2">
            <span>Where to, {user?.full_name?.split(' ')[0]}?</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">Move smarter with real-time autonomous routing.</p>
        </div>

        <div className="flex items-center bg-obsidian-900 border border-slate-800 rounded-2xl p-1">
          <button
            onClick={() => setActiveTab('book')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              activeTab === 'book'
                ? 'bg-electric-500 text-obsidian-950 shadow-md shadow-electric-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Book Ride</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              activeTab === 'history'
                ? 'bg-electric-500 text-obsidian-950 shadow-md shadow-electric-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Trip History</span>
          </button>
        </div>
      </div>

      {activeTab === 'history' ? (
        /* Ride History View */
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-obsidian-900 border border-slate-800 rounded-3xl p-6 shadow-xl"
        >
          <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
            <History className="w-5 h-5 text-electric-400" />
            <span>Your Completed & Past Rides</span>
          </h2>

          {rideHistory.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No previous rides found. Request your first ride today!
            </div>
          ) : (
            <div className="space-y-3">
              {rideHistory.map((trip) => (
                <div key={trip.id} className="p-4 rounded-2xl bg-obsidian-950 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-300">Ride #{trip.id}</span>
                      <RideStatusBadge status={trip.status} />
                      <span className="text-[11px] text-slate-500">{new Date(trip.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="text-xs text-slate-300 mt-1 flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-electric-400"></span>
                      <span className="font-medium">{trip.pickup_address}</span>
                      <span className="text-slate-500">→</span>
                      <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                      <span className="font-medium">{trip.dropoff_address}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Tier: {trip.vehicle_type} • {trip.distance_km} km • {trip.duration_minutes} min
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end space-x-4 border-t md:border-t-0 pt-2 md:pt-0 border-slate-800">
                    {trip.driver && (
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-200">{trip.driver.full_name}</div>
                        <div className="text-[10px] text-slate-400">RYDO Driver</div>
                      </div>
                    )}
                    <div className="text-right">
                      <div className="text-base font-extrabold text-white">${(trip.final_fare || trip.estimated_fare).toFixed(2)}</div>
                      <div className="text-[10px] text-electric-400">Settled • Card</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      ) : (
        /* Main Interactive Map & Booking Area */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Interactive Map */}
          <div className="lg:col-span-7 space-y-3">
            <div className="relative">
              <LiveMap
                pickup={activeRide ? { lat: activeRide.pickup_lat, lng: activeRide.pickup_lng, address: activeRide.pickup_address } : pickup}
                dropoff={activeRide ? { lat: activeRide.dropoff_lat, lng: activeRide.dropoff_lng, address: activeRide.dropoff_address } : dropoff}
                driverLocation={liveDriverPos}
                isSearching={activeRide?.status === 'SEARCHING'}
                selectionMode={selectionMode}
                onLocationSelect={handleMapLocationSelect}
                className="h-[520px] w-full rounded-3xl overflow-hidden border border-slate-800 shadow-2xl"
              />

              {/* In-Map Telemetry HUD */}
              <div className="absolute top-4 right-4 z-[400] flex items-center space-x-2">
                <div className="px-3 py-1.5 rounded-xl bg-obsidian-900/90 backdrop-blur-md border border-slate-700/80 text-[11px] text-slate-300 font-semibold shadow-xl flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-electric-400 animate-pulse" />
                  <span>Interactive Map • 3D Interpolation</span>
                </div>
              </div>
            </div>

            {/* Quick City Hub Presets */}
            {!activeRide && (
              <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
                <span className="text-slate-500 font-semibold uppercase text-[10px] shrink-0">City Presets:</span>
                {PRESET_HUBS.map((hub) => (
                  <button
                    key={hub.name}
                    onClick={() => setDropoff(hub)}
                    className="px-3 py-1.5 rounded-full bg-obsidian-900 hover:bg-obsidian-850 border border-slate-800 text-slate-300 hover:text-white shrink-0 transition cursor-pointer"
                  >
                    📍 {hub.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: 3D Vehicle Showcase + Booking / Active Monitor */}
          <div className="lg:col-span-5">
            <AnimatePresence mode="wait">
              {activeRide ? (
                /* ACTIVE RIDE MONITOR */
                <motion.div
                  key="active-monitor"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="bg-obsidian-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5"
                >
                  {/* Status header */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Trip #{activeRide.id}</div>
                      <h3 className="text-base font-black text-white mt-0.5">
                        {activeRide.status === 'SEARCHING' && 'Finding your nearest RYDO driver...'}
                        {activeRide.status === 'ACCEPTED' && 'Driver is Heading to You'}
                        {activeRide.status === 'ARRIVED' && 'Driver Has Arrived at Pickup!'}
                        {activeRide.status === 'IN_PROGRESS' && 'En Route to Destination'}
                      </h3>
                    </div>
                    <RideStatusBadge status={activeRide.status} />
                  </div>

                  {/* 3D Vehicle representation in active trip */}
                  <div className="rounded-2xl overflow-hidden border border-slate-800/80 shadow-inner">
                    <Suspense fallback={<div className="h-44 w-full bg-obsidian-950 animate-pulse" />}>
                      <VehiclePreviewCanvas
                        vehicleType={(activeRide.vehicle_type as any) || 'GO'}
                        isDriving={activeRide.status === 'IN_PROGRESS'}
                      />
                    </Suspense>
                  </div>

                  {/* Searching pulse banner */}
                  {activeRide.status === 'SEARCHING' && (
                    <div className="p-4 rounded-2xl bg-electric-500/10 border border-electric-500/20 text-center space-y-2">
                      <div className="text-xs font-extrabold text-electric-400">
                        Dispatching request to nearest available drivers
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Live radar active. You will be paired automatically in seconds.
                      </p>
                    </div>
                  )}

                  {/* Driver Card */}
                  {activeRide.driver && (
                    <div className="p-3.5 rounded-2xl bg-obsidian-950 border border-slate-800/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <img
                            src={activeRide.driver.avatar_url || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"}
                            alt={activeRide.driver.full_name}
                            className="w-11 h-11 rounded-full border-2 border-electric-400 object-cover"
                          />
                          <div>
                            <h4 className="font-bold text-white text-xs">{activeRide.driver.full_name}</h4>
                            <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                              <span className="text-amber-400">★ {activeRide.driver_profile?.rating || '5.0'}</span>
                              <span>•</span>
                              <span>{activeRide.driver_profile?.total_trips || '100+'} trips</span>
                            </div>
                          </div>
                        </div>

                        <a
                          href={`tel:${activeRide.driver.phone || '+15550192'}`}
                          className="p-2.5 rounded-xl bg-electric-500/10 text-electric-400 border border-electric-500/30 hover:bg-electric-500 hover:text-obsidian-950 transition"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      </div>

                      {activeRide.driver_profile && (
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                          <div>
                            <span className="text-slate-400">Vehicle: </span>
                            <span className="font-bold text-slate-200">
                              {activeRide.driver_profile.vehicle_color} {activeRide.driver_profile.vehicle_make} {activeRide.driver_profile.vehicle_model}
                            </span>
                          </div>
                          <div className="px-2 py-0.5 rounded bg-obsidian-850 text-electric-400 font-mono font-bold tracking-wider">
                            {activeRide.driver_profile.license_plate}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 4-Digit Security PIN */}
                  {activeRide.otp_code && activeRide.status !== 'IN_PROGRESS' && (
                    <div className="p-3 rounded-2xl bg-electric-500/10 border border-electric-500/30 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-bold text-electric-400 uppercase tracking-wider">Security PIN (Give to Driver)</div>
                        <div className="text-2xl font-black text-white tracking-widest mt-0.5">{activeRide.otp_code}</div>
                      </div>
                      <Shield className="w-7 h-7 text-electric-400/80" />
                    </div>
                  )}

                  {/* Fare & Route Info */}
                  <div className="p-3 rounded-2xl bg-obsidian-950 border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400">Estimated Fare</span>
                      <div className="text-lg font-black text-white">${activeRide.estimated_fare.toFixed(2)}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400">Vehicle Tier</span>
                      <div className="text-xs font-bold text-electric-400">RYDO {activeRide.vehicle_type}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-3 pt-2">
                    <button
                      onClick={() => setShowSafetyModal(true)}
                      className="flex-1 py-2.5 rounded-xl bg-obsidian-850 hover:bg-obsidian-800 text-slate-200 text-xs font-bold border border-slate-700 flex items-center justify-center space-x-1.5 transition"
                    >
                      <Shield className="w-3.5 h-3.5 text-electric-400" />
                      <span>Safety Toolkit</span>
                    </button>

                    {activeRide.status !== 'IN_PROGRESS' && (
                      <button
                        onClick={() => setShowCancelModal(true)}
                        className="px-4 py-2.5 rounded-xl border border-rose-500/30 hover:bg-rose-500/10 text-rose-400 text-xs font-bold transition"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </motion.div>
              ) : (
                /* BOOKING & 3D VEHICLE SHOWCASE */
                <motion.div
                  key="booking-panel"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="bg-obsidian-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-black text-white">Select Vehicle & Book</h3>
                      <p className="text-[11px] text-slate-400">Dynamic pricing • Electric 3D fleet</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-electric-500/10 text-electric-400 border border-electric-500/20">
                      RYDO {selectedTier}
                    </span>
                  </div>

                  {/* 3D Interactive Vehicle Preview */}
                  <div className="rounded-2xl overflow-hidden border border-slate-800/80 shadow-inner">
                    <Suspense fallback={<div className="h-44 w-full bg-obsidian-950 animate-pulse rounded-2xl" />}>
                      <VehiclePreviewCanvas vehicleType={selectedTier} />
                    </Suspense>
                  </div>

                  {/* Location Inputs */}
                  <div className="space-y-2.5">
                    {/* Pickup */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Pickup Spot
                      </label>
                      <div className="relative flex items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-electric-400 absolute left-3" />
                        <input
                          type="text"
                          value={pickup.address}
                          onChange={(e) => setPickup({ ...pickup, address: e.target.value })}
                          className="w-full bg-obsidian-950 border border-slate-800 rounded-xl pl-8 pr-20 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-electric-500 transition"
                        />
                        <button
                          type="button"
                          onClick={() => setSelectionMode(selectionMode === 'pickup' ? null : 'pickup')}
                          className={`absolute right-2 px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                            selectionMode === 'pickup'
                              ? 'bg-electric-500 text-obsidian-950 border-electric-400'
                              : 'bg-obsidian-850 text-slate-300 border-slate-700 hover:bg-obsidian-800'
                          }`}
                        >
                          {selectionMode === 'pickup' ? 'Cancel' : 'Pick on Map'}
                        </button>
                      </div>
                    </div>

                    {/* Destination */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Destination
                      </label>
                      <div className="relative flex items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-400 absolute left-3" />
                        <input
                          type="text"
                          value={dropoff.address}
                          onChange={(e) => setDropoff({ ...dropoff, address: e.target.value })}
                          className="w-full bg-obsidian-950 border border-slate-800 rounded-xl pl-8 pr-20 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-electric-500 transition"
                        />
                        <button
                          type="button"
                          onClick={() => setSelectionMode(selectionMode === 'dropoff' ? null : 'dropoff')}
                          className={`absolute right-2 px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                            selectionMode === 'dropoff'
                              ? 'bg-electric-500 text-obsidian-950 border-electric-400'
                              : 'bg-obsidian-850 text-slate-300 border-slate-700 hover:bg-obsidian-800'
                          }`}
                        >
                          {selectionMode === 'dropoff' ? 'Cancel' : 'Pick on Map'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Tier Categories List */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      <span>Select Mobility Tier</span>
                      {estimates && (
                        <span className="text-slate-400 normal-case font-normal text-[10px]">
                          {estimates.distance_km} km • {estimates.duration_minutes} min
                        </span>
                      )}
                    </div>

                    {estimating ? (
                      <div className="py-6 text-center text-slate-400 text-xs animate-pulse">
                        Calculating optimal route & fares...
                      </div>
                    ) : estimates?.tiers ? (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {estimates.tiers.map((tier) => (
                          <FareCard
                            key={tier.vehicle_type}
                            tier={tier}
                            isSelected={selectedTier === tier.vehicle_type}
                            onSelect={() => setSelectedTier(tier.vehicle_type as any)}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {/* Confirm & Book Button */}
                  <button
                    onClick={handleRequestRide}
                    disabled={requestingRide || !estimates}
                    className="w-full py-3.5 rounded-2xl bg-electric-500 hover:bg-electric-400 text-obsidian-950 text-xs sm:text-sm font-black transition shadow-lg shadow-electric-500/25 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>{requestingRide ? 'Finding your nearest RYDO driver...' : `Request RYDO ${selectedTier}`}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      )}

      {/* Safety Modal */}
      {showSafetyModal && activeRide && (
        <SafetyModal ride={activeRide} onClose={() => setShowSafetyModal(false)} />
      )}

      {/* Rating Modal */}
      {showRatingModal && completedRideToRate && (
        <RatingModal
          rideId={completedRideToRate.id}
          driverName={completedRideToRate.driver?.full_name || 'Your Driver'}
          driverAvatar={completedRideToRate.driver?.avatar_url}
          fare={completedRideToRate.final_fare || completedRideToRate.estimated_fare}
          onClose={() => setShowRatingModal(false)}
          onSuccess={() => setShowRatingModal(false)}
        />
      )}

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-obsidian-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-obsidian-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-white text-base">Cancel Ride?</h3>
            <p className="text-xs text-slate-400">Please choose a reason:</p>
            
            <select
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full bg-obsidian-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
            >
              <option value="Change of plans">Change of plans</option>
              <option value="Driver is taking too long">Driver is taking too long</option>
              <option value="Driver asked to cancel">Driver asked to cancel</option>
              <option value="Booked by mistake">Booked by mistake</option>
            </select>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="w-1/2 py-2 rounded-xl bg-obsidian-850 text-slate-300 text-xs font-semibold hover:bg-obsidian-800"
              >
                Keep Ride
              </button>
              <button
                onClick={handleCancelRide}
                className="w-1/2 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
