import { useEffect, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import {
  TRACKING_TIMEOUT_HOURS,
  TRACKING_COLOR_GREEN_MINS,
  TRACKING_COLOR_YELLOW_MINS,
} from '../../utils/trackingConfig';

interface LocationData {
  id: string;
  topic: string;
  tracker_id: string | null;
  lat: number;
  lon: number;
  timestamp: number;
  accuracy: number | null;
  altitude: number | null;
  battery: number | null;
  velocity: number | null;
  trigger: string | null;
  connection: string | null;
}

const getMarkerIcon = (diffMinutes: number): L.Icon => {
  let color = 'red';
  if (diffMinutes < TRACKING_COLOR_GREEN_MINS) {
    color = 'green';
  } else if (diffMinutes < TRACKING_COLOR_YELLOW_MINS) {
    color = 'yellow';
  }

  return new L.Icon({
    iconUrl: `/images/icons/marker-icon-${color}.png`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: '/images/icons/marker-shadow.png',
    shadowSize: [41, 41],
  });
};

const getUsernameFromTopic = (topic: string): string => {
  const parts = topic.split('/');
  return parts.length >= 2 ? parts[1] : topic;
};

export function TrackingLayer() {
  const [locations, setLocations] = useState<LocationData[]>([]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch('/api/tracking?latest=true');
        if (!response.ok) throw new Error('Error carregant tracking');
        const data: LocationData[] = await response.ok ? await response.json() : [];
        
        const now = Math.floor(Date.now() / 1000);
        const limitSeconds = TRACKING_TIMEOUT_HOURS * 3600;

        const filtered = data.filter((loc) => {
          const diff = now - loc.timestamp;
          return diff >= 0 && diff < limitSeconds;
        });

        setLocations(filtered);
      } catch (err) {
        console.error('[TrackingLayer] Error:', err);
      }
    };

    fetchLocations();
    const interval = setInterval(fetchLocations, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {locations.map((loc) => {
        const now = Math.floor(Date.now() / 1000);
        const diffMinutes = Math.max(0, Math.floor((now - loc.timestamp) / 60));
        const username = getUsernameFromTopic(loc.topic);

        return (
          <Marker
            key={loc.id}
            position={[loc.lat, loc.lon]}
            icon={getMarkerIcon(diffMinutes)}
          >
            <Popup>
              <div style={{ minWidth: '150px' }}>
                <h4 style={{ margin: '0 0 5px 0' }}>👤 {username}</h4>
                <p style={{ margin: '3px 0', fontSize: '0.9em' }}>
                  <strong>ID:</strong> {loc.tracker_id || 'N/A'}
                </p>
                <p style={{ margin: '3px 0', fontSize: '0.9em' }}>
                  <strong>Actiu fa:</strong> {diffMinutes} min
                </p>
                {loc.battery !== null && (
                  <p style={{ margin: '3px 0', fontSize: '0.9em' }}>
                    <strong>Bateria:</strong> {loc.battery}%
                  </p>
                )}
                {loc.velocity !== null && (
                  <p style={{ margin: '3px 0', fontSize: '0.9em' }}>
                    <strong>Velocitat:</strong> {loc.velocity} km/h
                  </p>
                )}
                {loc.accuracy !== null && (
                  <p style={{ margin: '3px 0', fontSize: '0.8em', color: '#666' }}>
                    Precisió: {loc.accuracy}m
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
