// Capa de posicions OwnTracks: pins en forma de gota amb color segons antiguitat.
import { Marker, Popup, Pane } from "react-leaflet";
import L from "leaflet";
import { useAuth } from "../../contexts/AuthContext";
import type { Position } from "../../hooks/usePositionPolling";
import { timeAgo } from "../../utils/time";

function ageColor(receivedAt: number): string {
  const age = Date.now() - receivedAt;
  if (age < 120000) {
    return "#22c55e";
  }
  if (age < 300000) {
    return "#eab308";
  }
  if (age < 600000) {
    return "#f97316";
  }
  return "#ef4444";
}

function pinIcon(label: string, bgColor: string): L.DivIcon {
  return L.divIcon({
    className: "",
    iconSize: [26, 44],
    iconAnchor: [13, 44],
    popupAnchor: [0, -44],
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
  className: "",
  iconSize: [0, 0],
  html: '<div style="width:1px;height:1px;opacity:0"></div>',
});

/** Renderitza els pins de posició a un pane amb z-index elevat (per sobre d'hidrants). */
export const TrackingLayer: React.FC<{ positions: Record<string, Position> }> = ({ positions }) => {
  const { user } = useAuth();

  if (!user) {
    return <Marker position={[0, 0]} icon={placeholderIcon} />;
  }
  const markers = Object.entries(positions);
  if (markers.length === 0) {
    return <Marker position={[0, 0]} icon={placeholderIcon} />;
  }

  return (
    <Pane name="trackingPane" style={{ zIndex: 1000 }}>
      {markers.map(([username, pos]) => (
        <Marker
          key={`${username}-${pos.receivedAt || pos.timestamp}`}
          position={[pos.lat, pos.lon]}
          icon={pinIcon(username.slice(-3), ageColor(pos.receivedAt))}
        >
          <Popup>
            <div className="text-[0.85rem] leading-[1.4] whitespace-nowrap min-w-30">
              <strong>{username}</strong>
              <br />
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
