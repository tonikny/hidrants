// Capa de posicions OwnTracks: pins en forma de gota amb color segons antiguitat.
import { Marker, Popup, Pane } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../../contexts/AuthContext';
import { usePositionPolling } from '../../hooks/usePositionPolling';

const COLORS = [
  '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
  '#911eb4', '#42d4f4', '#f032e6', '#bfef45', '#fabed4',
  '#469990', '#dcbeff', '#9a6324', '#fffac8', '#800000',
  '#aaffc3', '#808000', '#ffd8b1', '#000075', '#a9a9a9',
];

function userColor(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

function ageColor(receivedAt: number): string {
  const age = Date.now() - receivedAt;
  if (age < 120000) return '#22c55e';
  if (age < 300000) return '#eab308';
  if (age < 600000) return '#f97316';
  return '#ef4444';
}

function timeAgo(ts: number): string {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return `fa ${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `fa ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `fa ${h} h`;
  return `fa ${Math.floor(h / 24)} dies`;
}

function pinIcon(label: string, bgColor: string): L.DivIcon {
  return L.divIcon({
    className: '',
    iconSize: [26, 44], iconAnchor: [13, 44], popupAnchor: [0, -44],
    html: `<div style="position:relative;display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.3))">
      <div style="width:26px;height:26px;border-radius:50%;background:${bgColor};display:flex;align-items:center;justify-content:center;">
        <span style="font-size:9px;font-weight:700;color:#333">${label}</span>
      </div>
      <div style="width:0;height:0;margin-top:-2px;border-left:6px solid transparent;border-right:6px solid transparent;border-top:9px solid ${bgColor};"></div>
    </div>`,
  });
}

// Icona 1x1 transparent per mantenir l'overlay registrat al LayersControl.
const placeholderIcon = L.divIcon({
  className: '',
  iconSize: [0, 0],
  html: '<div style="width:1px;height:1px;opacity:0"></div>',
});

/** Renderitza els pins de posició a un pane amb z-index elevat (per sobre d'hidrants). */
export const TrackingLayer: React.FC = () => {
  const { user } = useAuth();
  const positions = usePositionPolling(15000);

  if (!user) return <Marker position={[0, 0]} icon={placeholderIcon} />;
  const markers = Object.entries(positions);
  if (markers.length === 0) return <Marker position={[0, 0]} icon={placeholderIcon} />;

  return (
    <Pane name="trackingPane" style={{ zIndex: 1000 }}>
      {markers.map(([username, pos]) => (
        <Marker key={`${username}-${pos.receivedAt || pos.timestamp}`}
          position={[pos.lat, pos.lon]}
          icon={pinIcon(username.slice(-3), ageColor(pos.receivedAt))}>
          <Popup>
            <div style={{ fontSize: '0.85rem', lineHeight: 1.4, whiteSpace: 'nowrap', minWidth: 120 }}>
              <strong>{username}</strong><br />
              bateria: {pos.battery}%<br />
              precisió: {pos.accuracy}m<br />
              {timeAgo(pos.receivedAt || pos.timestamp * 1000)}
            </div>
          </Popup>
        </Marker>
      ))}
    </Pane>
  );
};