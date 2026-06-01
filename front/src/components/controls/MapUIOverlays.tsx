import { useState, useEffect } from 'react';
import { FullscreenButton } from './FullscreenButton';
import { SyncButton } from './SyncButton';
import { Login } from '../ui/Login';
import { LegendModal } from '../ui/LegendModal';
import { HydrantListModal } from '../ui/HydrantListModal';
import { NewNodeButton } from './NewNodeButton';
import { CoordinateModal } from '../ui/CoordinateModal';
import { LocateButton } from './LocateButton';
import { ZoomDisplay } from './ZoomDisplay';
import { AdfSelector } from '../ui/AdfSelector';
import { Modal } from '../ui/Modal';
import {
  floatingButtonStyle,
  controlContainerStyle,
  controlItemStyle,
} from '../../styles/uiStyles';

interface MapUIOverlaysProps {
  user: any;
  logout: () => void;
  activeAdf: any;
  setActiveAdf: (adf: any) => void;
  loadingHidrants: boolean;
  hidrantsError: string | null;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  showCoordModal: boolean;
  setShowCoordModal: (show: boolean) => void;
  onCoordinateConfirm: (lat: number, lon: number) => void;
  onLocateEdit?: (latlng: L.LatLng) => void;
  setLocatePosition: (latlng: L.LatLng | null) => void;
  setLocateAccuracy?: (accuracy: number | null) => void;
  features: any[];
}

export function MapUIOverlays({
  user,
  logout,
  activeAdf,
  setActiveAdf,
  loadingHidrants,
  hidrantsError,
  showLoginModal,
  setShowLoginModal,
  showCoordModal,
  setShowCoordModal,
  onCoordinateConfirm,
  onLocateEdit,
  setLocatePosition,
  setLocateAccuracy,
  features,
}: MapUIOverlaysProps) {
  const [showAdfSelector, setShowAdfSelector] = useState(!activeAdf);
  const isAdmin = user?.role === 'admin';
  const isEditor = user?.role === 'admin' || user?.role === 'editor';

  // Sync state with activeAdf
  useEffect(() => {
    if (!activeAdf) {
      setShowAdfSelector(true);
    }
  }, [activeAdf]);

  // Leaflet-like bar style for grouping buttons
  const barStyle: React.CSSProperties = {
    backgroundColor: 'white',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxShadow: '0 1px 5px rgba(0,0,0,0.4)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    pointerEvents: 'auto',
  };

  const barButtonStyle: React.CSSProperties = {
    width: '34px',
    height: '34px',
    background: 'white',
    border: 'none',
    borderBottom: '1px solid #ccc',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.2rem',
    color: '#333',
    padding: 0,
    transition: 'background-color 0.2s',
  };

  return (
    <>
      {/* Top Left: Zoom control is at top: 10px, left: 10px (~70px high). */}
      <div
        style={{
          ...controlContainerStyle,
          top: '80px',
          left: '10px',
          alignItems: 'flex-start',
          gap: '8px',
        }}
      >
        <div style={controlItemStyle}>
          <button
            onClick={() => setShowAdfSelector(true)}
            style={floatingButtonStyle}
            title={activeAdf?.nom || 'Selector de ADF'}
          >
            🗺️
          </button>
        </div>

        {/* Login/Logout Button under ADF Selector */}
        <div style={controlItemStyle}>
          <button
            onClick={user ? logout : () => setShowLoginModal(true)}
            style={floatingButtonStyle}
            title={user ? `Surt de ${user.username}` : 'Accés'}
          >
            {user ? '🔓' : '🔐'}
          </button>
        </div>
      </div>

      {/* Top Right: Native Layers Control is at top: 10px, right: 10px.
          We place our controls under it with enough gap. */}
      <div
        style={{
          ...controlContainerStyle,
          top: '66px',
          right: '12px',
          alignItems: 'flex-end',
          gap: '8px',
        }}
      >
        {isEditor && (
          <div style={controlItemStyle}>
            <NewNodeButton
              style={floatingButtonStyle}
              onClick={() => setShowCoordModal(true)}
            />
          </div>
        )}

        <div style={controlItemStyle}>
          <LocateButton
            style={floatingButtonStyle}
            onEdit={onLocateEdit}
            setPosition={setLocatePosition}
            setAccuracy={setLocateAccuracy}
          />
        </div>

        <div style={controlItemStyle}>
          <FullscreenButton
            targetId="map-container"
            style={floatingButtonStyle}
          />
        </div>

        <div style={controlItemStyle}>
          <HydrantListModal style={floatingButtonStyle} features={features} />
        </div>

        <div style={controlItemStyle}>
          <LegendModal style={floatingButtonStyle} />
        </div>

        {isAdmin && activeAdf && (
          <div style={controlItemStyle}>
            <SyncButton style={floatingButtonStyle} />
          </div>
        )}
      </div>

      {/* Bottom Left: Zoom Display (Above Attribution if it were there, but on the left) */}
      <div style={{ ...controlContainerStyle, bottom: '5px', left: '5px' }}>
        <div style={controlItemStyle}>
          <ZoomDisplay />
        </div>
      </div>

      {showAdfSelector && (
        <AdfSelector onClose={() => activeAdf && setShowAdfSelector(false)} />
      )}

      {showLoginModal && !user && (
        <Modal onClose={() => setShowLoginModal(false)}>
          <Login />
        </Modal>
      )}

      {loadingHidrants && (
        <div
          style={{
            position: 'fixed',
            top: '4rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255, 255, 255, 0.8)',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            zIndex: 1000,
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            fontSize: '0.8rem',
            pointerEvents: 'none',
          }}
        >
          Actualitzant hidrants...
        </div>
      )}

      {hidrantsError && (
        <div
          style={{
            position: 'fixed',
            top: '6rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255, 0, 0, 0.8)',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            zIndex: 1000,
            fontSize: '0.8rem',
          }}
        >
          Error: {hidrantsError}
        </div>
      )}

      {showCoordModal && (
        <Modal title="📍 Coordenades" onClose={() => setShowCoordModal(false)}>
          <CoordinateModal
            onClose={() => setShowCoordModal(false)}
            onConfirm={onCoordinateConfirm}
          />
        </Modal>
      )}
    </>
  );
}
