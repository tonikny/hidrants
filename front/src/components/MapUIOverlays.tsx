import { FullscreenButton } from './FullscreenButton';
import { SyncButton } from './SyncButton';
import { Login } from './Login';
import { LegendModal } from './LegendModal';
import { NewNodeButton } from './NewNodeButton';
import { CoordinateModal } from './CoordinateModal';
import { floatingButtonStyle } from '../styles/uiStyles';

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
}: MapUIOverlaysProps) {
  return (
    <>
      <FullscreenButton targetId="map-container" />

      {/* Botó per canviar d'ADF / Sortir a selector */}
      <button
        onClick={() => setActiveAdf(null)}
        style={{
          position: 'fixed',
          top: '1rem',
          left: '1rem',
          ...floatingButtonStyle,
          background: 'white',
          color: 'black',
          width: 'auto',
          padding: '0 15px',
          height: '40px',
          fontSize: '0.9rem',
          fontWeight: 'bold',
          zIndex: 1000,
          border: 'none',
          borderRadius: '20px',
          cursor: 'pointer',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}
      >
        📍 {activeAdf?.nom || 'Selector'}
      </button>

      {user && activeAdf && (
        <SyncButton
          style={{
            position: 'fixed',
            top: '1rem',
            right: '1rem',
            ...floatingButtonStyle,
            background: 'white',
            color: 'black',
            width: '40px',
            height: '40px',
            fontSize: '1.2rem',
          }}
        />
      )}

      <button
        onClick={user ? logout : () => setShowLoginModal(true)}
        style={{
          position: 'fixed',
          top: '1rem',
          right: user ? '4.5rem' : '1rem',
          ...floatingButtonStyle,
          background: user ? '#e74c3c' : 'white',
          color: user ? 'white' : 'black',
          width: 'auto',
          padding: '0 10px',
          height: '40px',
          fontSize: '0.8rem',
          zIndex: 1000,
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        {user ? `Surt (${user.username})` : '🔐 Accés'}
      </button>

      {showLoginModal && !user && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000
        }} onClick={() => setShowLoginModal(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <Login />
          </div>
        </div>
      )}

      {loadingHidrants && (
        <div style={{
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
          pointerEvents: 'none'
        }}>
          Actualitzant hidrants...
        </div>
      )}

      {hidrantsError && (
        <div style={{
          position: 'fixed',
          top: '6rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255, 0, 0, 0.8)',
          color: 'white',
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          zIndex: 1000,
          fontSize: '0.8rem'
        }}>
          Error: {hidrantsError}
        </div>
      )}

      <LegendModal
        style={{
          position: 'fixed',
          bottom: '5rem',
          left: '1rem',
          ...floatingButtonStyle,
        }}
      />

      {user && (
        <NewNodeButton
          style={{
            position: 'fixed',
            bottom: '1rem',
            left: '1rem',
            ...floatingButtonStyle,
          }}
          onClick={() => setShowCoordModal(true)}
        />
      )}

      {showCoordModal && (
        <CoordinateModal
          onClose={() => setShowCoordModal(false)}
          onConfirm={onCoordinateConfirm}
        />
      )}
    </>
  );
}
