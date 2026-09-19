import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { apiClient } from '../../api/client';
import { LiveMap } from '../../components/map/LiveMap';
import { RideStatusBadge } from '../../components/RideStatusBadge';
import { Ride, DriverStatsResponse } from '../../types';
import { 
  Car, 
  Power, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Navigation, 
  AlertCircle, 
  Phone, 
  Key, 
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award
} from 'lucide-react';

const VehiclePreviewCanvas = lazy(() => import('../../components/3d/VehiclePreviewCanvas'));

export const DriverDashboard: React.FC = () => {
  const { user } = useAuth();
  const { subscribe } = useSocket();

  const [isOnline, setIsOnline] = useState(user?.driver_profile?.is_online ?? true);
  const [stats, setStats] = useState<DriverStatsResponse | null>(null);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [pendingOffers, setPendingOffers] = useState<Ride[]>([]);

  // OTP dialog for starting trip
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);

  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationIndex, setSimulationIndex] = useState(0);
  const [simulationPoints, setSimulationPoints] = useState<Array<{ lat: number; lng: number }>>([]);

  // Driver GPS coordinates
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number }>({
    lat: user?.driver_profile?.current_lat || 37.7749,
    lng: user?.driver_profile?.current_lng || -122.4194
  });

  // Fetch driver stats and active ride
  const fetchDriverState = async () => {
    try {
      const statsRes = await apiClient.get<DriverStatsResponse>('/drivers/stats');
      setStats(statsRes.data);
      setIsOnline(statsRes.data.is_online);

      // Check active ride
      const rideRes = await apiClient.get('/rides/active');
      if (rideRes.data.active && rideRes.data.ride) {
        setActiveRide(rideRes.data.ride);
      } else {
        setActiveRide(null);
        fetchOffers();
      }
    } catch (err) {
      console.error('Failed to load driver state', err);
    }
  };

  const fetchOffers = async () => {
    try {
      const res = await apiClient.get<Ride[]>('/drivers/offers');
      setPendingOffers(res.data);
    } catch (err) {
      console.error('Failed to load offers', err);
    }
  };

  useEffect(() => {
    fetchDriverState();
  }, []);

  // Real-time WebSocket Listeners
  useEffect(() => {
    const unsubOffer = subscribe('NEW_RIDE_OFFER', (data) => {
      if (isOnline && !activeRide) {
        setPendingOffers((prev) => [data.ride, ...prev.filter(r => r.id !== data.ride.id)]);
      }
    });

    const unsubCancel = subscribe('RIDE_CANCELLED', (data) => {
      if (activeRide && activeRide.id === data.ride.id) {
        setActiveRide(null);
        alert('The passenger cancelled this trip.');
        fetchDriverState();
      }
    });

    return () => {
      unsubOffer();
      unsubCancel();
    };
  }, [isOnline, activeRide, subscribe]);

  // Toggle Online/Offline
  const handleToggleOnline = async () => {
    const nextState = !isOnline;
    try {
      await apiClient.post('/drivers/toggle-online', { is_online: nextState });
      setIsOnline(nextState);
      if (nextState) {
        fetchOffers();
      } else {
        setPendingOffers([]);
      }
    } catch (err) {
      console.error('Failed to toggle online status', err);
    }
  };

  // Accept Ride Offer
  const handleAcceptRide = async (rideId: number) => {
    try {
      const res = await apiClient.post(`/drivers/accept/${rideId}`);
      setActiveRide(res.data);
      setPendingOffers([]);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Could not accept ride');
      fetchOffers();
    }
  };

  // Decline Ride Offer
  const handleDeclineRide = (rideId: number) => {
    setPendingOffers(prev => prev.filter(r => r.id !== rideId));
  };

  // Driver Arrived at Pickup
  const handleMarkArrived = async () => {
    if (!activeRide) return;
    try {
      const res = await apiClient.post(`/drivers/arrived/${activeRide.id}`);
      setActiveRide(res.data);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error updating status');
    }
  };

  // Start Trip with PIN
  const handleStartTrip = async () => {
    if (!activeRide) return;
    setOtpError(null);
    try {
      const res = await apiClient.post(`/drivers/start/${activeRide.id}`, {
        otp_code: enteredOtp
      });
      setActiveRide(res.data);
      setShowOtpInput(false);
      setEnteredOtp('');

      // Pre-load route simulation points
      const routeRes = await apiClient.get(`/drivers/simulation-route/${activeRide.id}`);
      if (routeRes.data.steps) {
        setSimulationPoints(routeRes.data.steps);
      }
    } catch (err: any) {
      setOtpError(err.response?.data?.detail || 'Invalid verification PIN');
    }
  };

  // Simulate Drive progress
  const handleSimulateDriving = async () => {
    if (!activeRide || simulationPoints.length === 0) return;
    setIsSimulating(true);

    let idx = 0;
    const interval = setInterval(async () => {
      if (idx < simulationPoints.length) {
        const pt = simulationPoints[idx];
        setDriverPos({ lat: pt.lat, lng: pt.lng });
        // Stream to backend & passenger
        try {
          await apiClient.post('/drivers/update-location', { lat: pt.lat, lng: pt.lng });
        } catch (e) {
          // ignore
        }
        idx++;
        setSimulationIndex(idx);
      } else {
        clearInterval(interval);
        setIsSimulating(false);
      }
    }, 1000);
  };

  // Complete Trip
  const handleCompleteTrip = async () => {
    if (!activeRide) return;
    try {
      const res = await apiClient.post(`/drivers/complete/${activeRide.id}`);
      alert(`Trip completed successfully! Payout: $${res.data.payment?.driver_payout?.toFixed(2) || '0.00'}`);
      setActiveRide(null);
      fetchDriverState();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error completing trip');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header & Availability Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-obsidian-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-obsidian-950 border-2 border-electric-500/50 flex items-center justify-center text-electric-400">
            <Car className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black text-white">{user?.full_name}</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-electric-500/10 text-electric-400 border border-electric-500/20">
                RYDO Driver • Verified
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {user?.driver_profile?.vehicle_color} {user?.driver_profile?.vehicle_make} {user?.driver_profile?.vehicle_model} • Plate: {user?.driver_profile?.license_plate}
            </p>
          </div>
        </div>

        {/* Go Online / Offline Toggle */}
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-300">
              Fleet Status: <span className={isOnline ? 'text-electric-400 font-bold' : 'text-slate-500'}>{isOnline ? 'Online & Receiving' : 'Offline'}</span>
            </div>
            <p className="text-[11px] text-slate-500">
              {isOnline ? 'Broadcasting live coordinates' : 'Switch online to accept trips'}
            </p>
          </div>

          <button
            onClick={handleToggleOnline}
            className={`px-5 py-3 rounded-2xl font-extrabold text-xs flex items-center space-x-2 transition shadow-lg cursor-pointer ${
              isOnline
                ? 'bg-electric-500 hover:bg-electric-400 text-obsidian-950 shadow-electric-500/20'
                : 'bg-obsidian-850 hover:bg-obsidian-800 text-slate-300 border border-slate-700'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{isOnline ? 'GO OFFLINE' : 'GO ONLINE'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-obsidian-900 border border-slate-800 shadow-lg flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-electric-500/10 text-electric-400 flex items-center justify-center font-black">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Payout Settled</div>
            <div className="text-2xl font-black text-white mt-0.5">
              ${stats?.total_earnings?.toFixed(2) || '0.00'}
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-obsidian-900 border border-slate-800 shadow-lg flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-black">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Trips Completed</div>
            <div className="text-2xl font-black text-white mt-0.5">
              {stats?.total_trips || 0} rides
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-obsidian-900 border border-slate-800 shadow-lg flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-black">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Driver Rating</div>
            <div className="text-2xl font-black text-white mt-0.5">
              ★ {stats?.rating?.toFixed(1) || '5.0'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Trip / Offers & Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Map */}
        <div className="lg:col-span-7">
          <LiveMap
            pickup={activeRide ? { lat: activeRide.pickup_lat, lng: activeRide.pickup_lng, address: activeRide.pickup_address } : null}
            dropoff={activeRide ? { lat: activeRide.dropoff_lat, lng: activeRide.dropoff_lng, address: activeRide.dropoff_address } : null}
            driverLocation={driverPos}
            routePoints={simulationPoints}
            className="h-[520px] w-full rounded-3xl overflow-hidden border border-slate-800 shadow-2xl"
          />
        </div>

        {/* Right: Active Trip Controls OR Incoming Offers */}
        <div className="lg:col-span-5 space-y-4">
          <AnimatePresence mode="wait">
            {activeRide ? (
              /* ACTIVE TRIP STEPPER */
              <motion.div
                key="driver-active-trip"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="bg-obsidian-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Trip In Progress #{activeRide.id}</span>
                    <h3 className="text-base font-black text-white mt-0.5">
                      {activeRide.status === 'ACCEPTED' && 'Navigate to Passenger'}
                      {activeRide.status === 'ARRIVED' && 'At Pickup Spot'}
                      {activeRide.status === 'IN_PROGRESS' && 'Driving to Destination'}
                    </h3>
                  </div>
                  <RideStatusBadge status={activeRide.status} />
                </div>

                {/* Passenger Card */}
                {activeRide.passenger && (
                  <div className="p-3.5 rounded-2xl bg-obsidian-950 border border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={activeRide.passenger.avatar_url || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"}
                        alt={activeRide.passenger.full_name}
                        className="w-10 h-10 rounded-full border border-slate-700 object-cover"
                      />
                      <div>
                        <h4 className="font-bold text-white text-xs">{activeRide.passenger.full_name}</h4>
                        <p className="text-[10px] text-slate-400">Passenger</p>
                      </div>
                    </div>

                    <a
                      href={`tel:${activeRide.passenger.phone || '+15550000'}`}
                      className="p-2 rounded-xl bg-electric-500/10 text-electric-400 hover:bg-electric-500 hover:text-obsidian-950 transition"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>
                )}

                {/* Route Details */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-start space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-electric-400 mt-1 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Pickup</span>
                      <p className="text-slate-200 font-medium">{activeRide.pickup_address}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400 mt-1 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Dropoff</span>
                      <p className="text-slate-200 font-medium">{activeRide.dropoff_address}</p>
                    </div>
                  </div>
                </div>

                {/* Driver Payout Preview */}
                <div className="p-3.5 rounded-2xl bg-electric-500/10 border border-electric-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-electric-400 font-bold uppercase tracking-wider">Driver Payout (80%)</span>
                    <div className="text-xl font-black text-white mt-0.5">
                      ${(activeRide.estimated_fare * 0.8).toFixed(2)}
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {activeRide.distance_km} km • {activeRide.duration_minutes} min
                  </span>
                </div>

                {/* Action Stepper */}
                <div className="space-y-2 pt-2">
                  {activeRide.status === 'ACCEPTED' && (
                    <button
                      onClick={handleMarkArrived}
                      className="w-full py-3.5 rounded-2xl bg-purple-500 hover:bg-purple-400 text-white font-extrabold text-xs transition shadow-lg shadow-purple-500/20 flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>I HAVE ARRIVED AT PICKUP</span>
                    </button>
                  )}

                  {activeRide.status === 'ARRIVED' && (
                    <button
                      onClick={() => setShowOtpInput(true)}
                      className="w-full py-3.5 rounded-2xl bg-electric-500 hover:bg-electric-400 text-obsidian-950 font-black text-xs transition shadow-lg shadow-electric-500/20 flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <Key className="w-4 h-4" />
                      <span>ENTER PASSENGER PIN & START TRIP</span>
                    </button>
                  )}

                  {activeRide.status === 'IN_PROGRESS' && (
                    <div className="space-y-2">
                      <button
                        onClick={handleSimulateDriving}
                        disabled={isSimulating}
                        className="w-full py-2.5 rounded-xl bg-obsidian-850 hover:bg-obsidian-800 text-electric-400 font-bold text-xs border border-electric-500/30 flex items-center justify-center space-x-2 transition cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isSimulating ? 'Simulating Smooth 3D Transit...' : 'Simulate Drive Progress on Map'}</span>
                      </button>

                      <button
                        onClick={handleCompleteTrip}
                        className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-dark-950 font-black text-xs transition shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>COMPLETE TRIP & COLLECT FARE</span>
                      </button>
                    </div>
                  )}
                </div>

              </motion.div>
            ) : (
              /* INCOMING OFFERS */
              <motion.div
                key="driver-offers"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="bg-obsidian-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-electric-400 animate-ping" />
                    <h3 className="font-extrabold text-white text-base">Incoming Dispatch Offers</h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-obsidian-850 text-slate-400 border border-slate-700">
                    {pendingOffers.length} available
                  </span>
                </div>

                {!isOnline ? (
                  <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                    <Power className="w-8 h-8 text-slate-600 mx-auto" />
                    <p>You are currently offline.</p>
                    <p className="text-slate-500">Switch to Online above to receive ride requests.</p>
                  </div>
                ) : pendingOffers.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                    <div className="w-10 h-10 rounded-full bg-electric-500/10 text-electric-400 flex items-center justify-center mx-auto animate-pulse">
                      <Clock className="w-5 h-5" />
                    </div>
                    <p className="font-bold text-slate-300">Searching for nearby dispatches...</p>
                    <p className="text-slate-500 text-[11px]">
                      Ride requests will alert here in real time.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingOffers.map((offer) => (
                      <motion.div
                        key={offer.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 rounded-2xl bg-obsidian-950 border border-electric-500/40 shadow-lg space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-electric-400 uppercase tracking-wider">
                            RYDO {offer.vehicle_type} Request
                          </span>
                          <div className="text-right">
                            <span className="text-lg font-black text-white">
                              ${(offer.estimated_fare * 0.8).toFixed(2)}
                            </span>
                            <span className="text-[9px] text-slate-400 block">Payout (80%)</span>
                          </div>
                        </div>

                        <div className="space-y-1 text-xs">
                          <div className="text-slate-300 font-medium">📍 {offer.pickup_address}</div>
                          <div className="text-slate-400 font-medium">🏁 {offer.dropoff_address}</div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                          <span>{offer.distance_km} km</span>
                          <span>Est. {offer.duration_minutes} min</span>
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                          <button
                            onClick={() => handleDeclineRide(offer.id)}
                            className="w-1/3 py-2 rounded-xl bg-obsidian-850 text-slate-400 text-xs font-semibold hover:bg-obsidian-800 cursor-pointer"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => handleAcceptRide(offer.id)}
                            className="w-2/3 py-2 rounded-xl bg-electric-500 hover:bg-electric-400 text-obsidian-950 text-xs font-black transition shadow-lg shadow-electric-500/20 cursor-pointer"
                          >
                            Accept Offer
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* OTP Modal */}
      {showOtpInput && (
        <div className="fixed inset-0 z-50 bg-obsidian-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-obsidian-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-white text-base">Enter Passenger PIN</h3>
            <p className="text-xs text-slate-400">Ask the passenger for their 4-digit code to verify:</p>

            {otpError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            <input
              type="text"
              maxLength={4}
              value={enteredOtp}
              onChange={(e) => setEnteredOtp(e.target.value)}
              placeholder="e.g. 5178"
              className="w-full bg-obsidian-950 border border-slate-800 rounded-xl p-3 text-center text-2xl font-mono font-bold tracking-widest text-electric-400 focus:outline-none focus:border-electric-500"
            />

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setShowOtpInput(false)}
                className="w-1/2 py-2.5 rounded-xl bg-obsidian-850 text-slate-300 text-xs font-semibold hover:bg-obsidian-800"
              >
                Cancel
              </button>
              <button
                onClick={handleStartTrip}
                className="w-1/2 py-2.5 rounded-xl bg-electric-500 hover:bg-electric-400 text-obsidian-950 text-xs font-extrabold"
              >
                Verify & Start
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
