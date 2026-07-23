import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Loader2, Search } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import DriverMarker from '@/components/drivers/DriverMarker';
import L from 'leaflet';

// Component to handle auto-fitting bounds when markers change
const FitBounds = ({ drivers }) => {
  const map = useMap();

  useEffect(() => {
    if (drivers.length > 0) {
      const bounds = L.latLngBounds(drivers.map(d => [d.latitude, d.longitude]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [drivers, map]);

  return null;
};

// Flies the map to a specific driver's coordinates when one is picked from search
const FlyToSelected = ({ target }) => {
  const map = useMap();

  useEffect(() => {
    if (target) {
      map.flyTo([target.latitude, target.longitude], 16, { duration: 0.8 });
    }
  }, [target, map]);

  return null;
};

const LiveTracking = () => {
  const [locations, setLocations] = useState({});
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [flyTarget, setFlyTarget] = useState(null);
  const { toast } = useToast();

  // Fetch driver profiles to enrich the location data
  const { data: drivers = [], isLoading: driversLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const { data } = await api.get('/drivers');
      return data;
    },
  });

  // Listen to Firestore driver_locations collection
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'driver_locations'), (snapshot) => {
      const newLocations = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.latitude !== 0.0 || data.longitude !== 0.0) {
          newLocations[doc.id] = data;
        }
      });
      setLocations(prev => ({ ...prev, ...newLocations }));
    }, (error) => {
      console.error("Error fetching live locations:", error);
    });

    return () => unsubscribe();
  }, []);

  // Force re-evaluation of staleness every 30 seconds
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  // Merge locations with driver profiles and apply staleness filter
  const activeDrivers = useMemo(() => {
    // Increased to 24 hours to tolerate Android emulator clock drift during testing
    const STALENESS_THRESHOLD_MS = 24 * 60 * 60 * 1000; 
    const now = new Date().getTime();

    // Map to keep track of coordinate counts for jitter
    const coordCounts = {};

    return Object.values(locations).filter(loc => {
      if (!loc.lastUpdate || !loc.lastUpdate.toDate) return false;
      const age = now - loc.lastUpdate.toDate().getTime();
      
      // If time is negative (emulator is in the future), treat it as fresh
      if (age < 0) return true;
      return age < STALENESS_THRESHOLD_MS;
    }).map(loc => {
      const profile = drivers.find(d => d.name === loc.driverId || d.id === loc.driverId);
      
      // Add jitter if multiple drivers are at the exact same coordinates or very close
      // Rounding to 4 decimal places groups markers within ~11 meters of each other
      const coordKey = `${Number(loc.latitude).toFixed(4)},${Number(loc.longitude).toFixed(4)}`;
      const count = coordCounts[coordKey] || 0;
      coordCounts[coordKey] = count + 1;
      
      let lat = loc.latitude;
      let lng = loc.longitude;
      
      if (count > 0) {
        // Offset by approximately 100 meters to prevent exact overlap
        // 0.0009 degrees is ~100 meters
        const angle = count * (Math.PI / 4); // Spread in a circle
        const radius = 0.0009 * Math.ceil(count / 8); 
        lat += Math.sin(angle) * radius;
        lng += Math.cos(angle) * radius;
      }
      
      return {
        ...loc,
        latitude: lat,
        longitude: lng,
        profile: profile || { name: loc.driverId, id: loc.driverId }
      };
    });
  }, [locations, drivers, tick]);

  const suggestions = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];
    return drivers.filter(d => (d.name || '').toLowerCase().includes(term)).slice(0, 8);
  }, [search, drivers]);

  const handleSelectDriver = (driver) => {
    setSearch(driver.name);
    setDropdownOpen(false);
    const live = activeDrivers.find(d => d.profile?.id === driver.id || d.driverId === driver.id || d.driverId === driver.name);
    if (live) {
      setFlyTarget({ latitude: live.latitude, longitude: live.longitude });
    } else {
      toast({ title: 'No live location', description: `${driver.name} isn't currently broadcasting their location.` });
    }
  };

  if (driversLoading) {
    return <LoadingSpinner label="Loading live tracking..." />;
  }

  // Default center if no drivers
  const defaultCenter = [33.6844, 73.0479]; // Islamabad
  const center = activeDrivers.length > 0 ? [activeDrivers[0].latitude, activeDrivers[0].longitude] : defaultCenter;

  return (
    <div className="flex flex-col h-full space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Live Tracking</h1>
        <p className="text-muted-foreground text-sm">Real-time GPS location of active drivers</p>
      </div>

      <div className="flex-1 min-h-[500px] glass-card rounded-xl overflow-hidden relative border border-border">
        <div className="absolute top-3 left-3 z-[1000] w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search driver by name..."
              value={search}
              onChange={e => { setSearch(e.target.value); setDropdownOpen(true); }}
              onFocus={() => setDropdownOpen(true)}
              onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
              className="pl-9 bg-card shadow-md"
            />
          </div>
          {dropdownOpen && suggestions.length > 0 && (
            <div className="mt-1 glass-card shadow-lg overflow-hidden max-h-56 overflow-y-auto">
              {suggestions.map(d => (
                <button
                  key={d.id}
                  type="button"
                  onMouseDown={() => handleSelectDriver(d)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted/60 transition-colors border-b border-border/40 last:border-0"
                >
                  {d.name}
                </button>
              ))}
            </div>
          )}
          {dropdownOpen && search.trim() && suggestions.length === 0 && (
            <div className="mt-1 glass-card shadow-lg px-3 py-2 text-sm text-muted-foreground">
              No drivers match "{search}".
            </div>
          )}
        </div>

        <MapContainer center={center} zoom={13} className="w-full h-full z-0">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          <FitBounds drivers={activeDrivers} />
          <FlyToSelected target={flyTarget} />

          {activeDrivers.map(driver => (
            <DriverMarker 
              key={driver.driverId} 
              driverId={driver.driverId}
              profile={driver.profile} 
              initialLocation={driver} 
            />
          ))}
        </MapContainer>
        
        {activeDrivers.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-[1000] pointer-events-none">
            <div className="glass-card p-6 rounded-xl flex flex-col items-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-lg font-semibold text-foreground">Waiting for live data...</p>
              <p className="text-sm text-muted-foreground text-center mt-2 max-w-xs">No active drivers are currently broadcasting their location within the last 2 minutes.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTracking;
