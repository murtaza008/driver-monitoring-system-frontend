import React, { useEffect, useState } from 'react';
import { Marker, Popup, Circle, useMap } from 'react-leaflet';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import L from 'leaflet';
import { getDriverInitials } from '@/utils/driverDisplay';

// Fix Leaflet's default icon path issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// A custom DivIcon factory to show driver avatar or initials
const createDriverIcon = (profile) => {
  let photoUrl = profile.photoUrl;
  
  // Apply Cloudinary thumbnail transform to avoid loading full-res images on the map
  if (photoUrl && photoUrl.includes('cloudinary.com')) {
    const uploadIndex = photoUrl.indexOf('/upload/');
    if (uploadIndex !== -1) {
      photoUrl = photoUrl.substring(0, uploadIndex + 8) + 'w_96,h_96,c_fill,g_face/' + photoUrl.substring(uploadIndex + 8);
    }
  }

  const isImage = !!photoUrl;
  const content = isImage 
    ? `<img src="${photoUrl}" class="w-full h-full object-cover rounded-full border-2 border-primary" />`
    : `<div class="w-full h-full flex items-center justify-center bg-primary text-primary-foreground font-bold rounded-full border-2 border-primary text-xs">${getDriverInitials(profile)}</div>`;

  return L.divIcon({
    html: `<div class="w-10 h-10 shadow-lg rounded-full">${content}</div>`,
    className: 'custom-driver-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

const DriverMarker = ({ driverId, profile, initialLocation = null }) => {
  const [location, setLocation] = useState(initialLocation);
  const map = useMap();

  useEffect(() => {
    // If the parent didn't pass a live location (e.g. DriverProfile map), we subscribe to it here
    if (!initialLocation && driverId) {
      const unsubscribe = onSnapshot(doc(db, 'driver_locations', driverId), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.latitude !== 0.0 || data.longitude !== 0.0) {
            setLocation(data);
          }
        }
      }, (error) => {
        console.error("Error fetching live location for driver", driverId, error);
      });
      return () => unsubscribe();
    }
  }, [driverId, initialLocation]);

  // If initialLocation changes from parent (e.g. LiveTracking map), update state
  useEffect(() => {
    if (initialLocation) {
      setLocation(initialLocation);
    }
  }, [initialLocation]);

  if (!location || location.latitude === 0.0 || location.longitude === 0.0) {
    return null;
  }

  const handleClick = () => {
    map.flyTo([location.latitude, location.longitude], Math.max(map.getZoom(), 16), {
      duration: 1.5
    });
  };

  return (
    <React.Fragment>
      <Marker 
        position={[location.latitude, location.longitude]}
        icon={createDriverIcon(profile)}
        eventHandlers={{ click: handleClick }}
      >
        <Popup className="custom-popup">
          <div className="text-sm">
            <p className="font-bold">{profile.name}</p>
            <p>Speed: {Math.round(location.speed || 0)} km/h</p>
            <p className="text-xs text-muted-foreground mb-2">
              Last Update: {location.lastUpdate?.toDate ? location.lastUpdate.toDate().toLocaleTimeString() : 'N/A'}
            </p>
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs font-medium text-primary hover:underline mt-1"
            >
              Open in Google Maps
            </a>
          </div>
        </Popup>
      </Marker>
      
      {/* Accuracy Circle */}
      {location.accuracy && (
        <Circle 
          center={[location.latitude, location.longitude]}
          radius={location.accuracy}
          pathOptions={{ color: 'hsl(187,72%,50%)', fillColor: 'hsl(187,72%,50%)', fillOpacity: 0.2, weight: 1 }}
        />
      )}
    </React.Fragment>
  );
};

export default DriverMarker;
