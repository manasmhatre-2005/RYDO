export type Role = 'passenger' | 'driver' | 'admin';

export type RideStatusType = 
  | 'REQUESTED'
  | 'SEARCHING'
  | 'ACCEPTED'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  role: Role;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  driver_profile?: DriverProfile;
}

export interface DriverProfile {
  id: number;
  user_id: number;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  license_plate: string;
  vehicle_type: 'GO' | 'COMFORT' | 'XL' | 'PREMIUM';
  vehicle_color?: string;
  is_verified: boolean;
  is_online: boolean;
  current_lat?: number;
  current_lng?: number;
  rating: number;
  total_trips: number;
  total_earnings: number;
  created_at: string;
}

export interface DriverStatsResponse {
  total_trips: number;
  total_earnings: number;
  rating: number;
  is_online: boolean;
  is_verified: boolean;
  active_ride_id?: number | null;
}

export interface Payment {
  id: number;
  ride_id: number;
  amount: number;
  platform_fee: number;
  driver_payout: number;
  method: string;
  status: string;
  transaction_id: string;
  created_at: string;
}

export interface Rating {
  id: number;
  ride_id: number;
  passenger_id: number;
  driver_id: number;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface Ride {
  id: number;
  passenger_id: number;
  driver_id?: number;
  status: RideStatusType;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  vehicle_type: string;
  estimated_fare: number;
  final_fare?: number;
  distance_km: number;
  duration_minutes: number;
  otp_code?: string;
  cancellation_reason?: string;
  cancelled_by?: string;
  created_at: string;
  accepted_at?: string;
  arrived_at?: string;
  started_at?: string;
  completed_at?: string;
  passenger?: User;
  driver?: User;
  driver_profile?: DriverProfile;
  driver_current_lat?: number;
  driver_current_lng?: number;
  payment?: Payment;
  rating?: Rating;
}

export interface FareTierEstimate {
  vehicle_type: string;
  name: string;
  description: string;
  capacity: number;
  estimated_fare: number;
  distance_km: number;
  duration_minutes: number;
  eta_minutes: number;
  base_fare: number;
  rate_per_km: number;
}

export interface FareEstimateResponse {
  distance_km: number;
  duration_minutes: number;
  tiers: FareTierEstimate[];
}

export interface AdminAnalytics {
  total_gmv: number;
  total_platform_revenue: number;
  total_driver_payouts: number;
  total_rides: number;
  completed_rides: number;
  cancelled_rides: number;
  active_rides: number;
  total_passengers: number;
  total_drivers: number;
  online_drivers: number;
  pending_verifications: number;
  average_rating: number;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  role: Role;
  user_id: number;
  full_name: string;
  email: string;
}
