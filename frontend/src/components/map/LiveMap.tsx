import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface MapProps {
  pickup?: { lat: number; lng: number; address?: string } | null;
  dropoff?: { lat: number; lng: number; address?: string } | null;
  driverLocation?: { lat: number; lng: number; bearing?: number } | null;
  nearbyDrivers?: Array<{ id: number; lat: number; lng: number; vehicle_type?: string }>;
  routePoints?: Array<{ lat: number; lng: number }>;
  onLocationSelect?: (coords: { lat: number; lng: number }) => void;
  selectionMode?: 'pickup' | 'dropoff' | null;
  className?: string;
}

export const LiveMap: React.FC<MapProps> = ({
  pickup,
  dropoff,
  driverLocation,
  nearbyDrivers = [],
  routePoints = [],
  onLocationSelect,
  selectionMode,
  className = "h-[450px] w-full rounded-2xl overflow-hidden border border-slate-800"
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const dropoffMarkerRef = useRef<L.Marker | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const nearbyMarkersRef = useRef<L.Marker[]>([]);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default center: Downtown San Francisco
    const initialLat = pickup?.lat || 37.7749;
    const initialLng = pickup?.lng || -122.4194;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: false,
    });

    // Sleek CartoDB Dark Matter tiles (free, fast, beautiful dark UI)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 19,
      className: 'dark-tiles'
    }).addTo(map);

    // Zoom control in bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Map click handler
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (onLocationSelect) {
        onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Pickup Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (pickupMarkerRef.current) {
      map.removeLayer(pickupMarkerRef.current);
      pickupMarkerRef.current = null;
    }

    if (pickup) {
      const pickupIcon = L.divIcon({
        className: 'custom-pin',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white shadow-lg flex items-center justify-center animate-bounce">
              <div class="w-2 h-2 rounded-full bg-dark-950"></div>
            </div>
            <div class="absolute -bottom-1 w-2 h-2 bg-emerald-500 rotate-45"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 24],
      });

      const marker = L.marker([pickup.lat, pickup.lng], { icon: pickupIcon })
        .addTo(map)
        .bindPopup(`<b>Pickup Location</b><br/>${pickup.address || 'Selected Spot'}`);
      
      pickupMarkerRef.current = marker;
    }
  }, [pickup]);

  // Update Dropoff Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (dropoffMarkerRef.current) {
      map.removeLayer(dropoffMarkerRef.current);
      dropoffMarkerRef.current = null;
    }

    if (dropoff) {
      const dropoffIcon = L.divIcon({
        className: 'custom-pin',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-6 h-6 rounded-full bg-rose-500 border-2 border-white shadow-lg flex items-center justify-center">
              <div class="w-2 h-2 rounded-full bg-white"></div>
            </div>
            <div class="absolute -bottom-1 w-2 h-2 bg-rose-500 rotate-45"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 24],
      });

      const marker = L.marker([dropoff.lat, dropoff.lng], { icon: dropoffIcon })
        .addTo(map)
        .bindPopup(`<b>Destination</b><br/>${dropoff.address || 'Selected Spot'}`);
      
      dropoffMarkerRef.current = marker;
    }
  }, [dropoff]);

  // Update Active Driver Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (driverMarkerRef.current) {
      map.removeLayer(driverMarkerRef.current);
      driverMarkerRef.current = null;
    }

    if (driverLocation) {
      const driverIcon = L.divIcon({
        className: 'driver-car-icon',
        html: `
          <div class="w-9 h-9 rounded-full bg-dark-900 border-2 border-brand-400 shadow-xl flex items-center justify-center transform transition-transform duration-500 hover:scale-110">
            <svg class="w-5 h-5 text-brand-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.04 3H5.81l1.04-3zM19 17H5v-4.66l.12-.34h13.77l.11.34V17z"/>
              <circle cx="7.5" cy="14.5" r="1.5"/>
              <circle cx="16.5" cy="14.5" r="1.5"/>
            </svg>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([driverLocation.lat, driverLocation.lng], { icon: driverIcon })
        .addTo(map)
        .bindPopup(`<b>RYDO Driver</b><br/>En Route`);
      
      driverMarkerRef.current = marker;
    }
  }, [driverLocation]);

  // Update Nearby Drivers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous
    nearbyMarkersRef.current.forEach(m => map.removeLayer(m));
    nearbyMarkersRef.current = [];

    nearbyDrivers.forEach(d => {
      const icon = L.divIcon({
        className: 'nearby-car',
        html: `
          <div class="w-6 h-6 rounded-full bg-dark-800/90 border border-brand-500/80 shadow-md flex items-center justify-center opacity-80 hover:opacity-100">
            <div class="w-2.5 h-2.5 rounded-full bg-brand-400"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      const marker = L.marker([d.lat, d.lng], { icon }).addTo(map);
      nearbyMarkersRef.current.push(marker);
    });
  }, [nearbyDrivers]);

  // Update Route Polyline & Auto Fit Bounds
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }

    if (pickup && dropoff) {
      let latlngs: [number, number][] = [];
      if (routePoints && routePoints.length > 0) {
        latlngs = routePoints.map(p => [p.lat, p.lng]);
      } else {
        // Direct route with curved midpoint
        const midLat = (pickup.lat + dropoff.lat) / 2 + 0.003;
        const midLng = (pickup.lng + dropoff.lng) / 2 - 0.003;
        latlngs = [
          [pickup.lat, pickup.lng],
          [midLat, midLng],
          [dropoff.lat, dropoff.lng]
        ];
      }

      const polyline = L.polyline(latlngs, {
        color: '#f59e0b',
        weight: 4,
        opacity: 0.85,
        dashArray: '8, 8',
      }).addTo(map);

      routePolylineRef.current = polyline;

      // Fit bounds nicely with padding
      const bounds = L.latLngBounds([
        [pickup.lat, pickup.lng],
        [dropoff.lat, dropoff.lng]
      ]);
      if (driverLocation) {
        bounds.extend([driverLocation.lat, driverLocation.lng]);
      }
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else if (pickup) {
      map.setView([pickup.lat, pickup.lng], 14);
    }
  }, [pickup, dropoff, routePoints, driverLocation]);

  return (
    <div className="relative">
      <div ref={mapContainerRef} className={className} />
      
      {selectionMode && (
        <div className="absolute top-4 left-4 z-[400] bg-dark-900/90 backdrop-blur-md border border-brand-500/50 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-xl flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-brand-400 animate-ping" />
          <span>Click on map to select {selectionMode === 'pickup' ? 'Pickup Spot' : 'Destination'}</span>
        </div>
      )}
    </div>
  );
};
