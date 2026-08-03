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
import { TrackingToggle } from '../ui/TrackingToggle';
import { Modal } from '../ui/Modal';
import {
  floatingButtonClass,
  controlContainerClass,
  controlItemClass,
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

  return (
    <>
      {/* Top Left: Zoom control is at top: 10px, left: 10px (~70px high). */}
      <div
        className={`${controlContainerClass} top-[80px] left-[10px] items-start gap-2`}
      >
        <div className={controlItemClass}>
          <button
            onClick={() => setShowAdfSelector(true)}
            className={floatingButtonClass}
            title={activeAdf?.nom || 'Selector de ADF'}
          >
            🗺️
          </button>
        </div>

        {/* Login/Logout Button under ADF Selector */}
        <div className={controlItemClass}>
          <button
            onClick={user ? logout : () => setShowLoginModal(true)}
            className={floatingButtonClass}
            title={user ? `Surt de ${user.username}` : 'Accés'}
          >
            {user ? '🔓' : '🔐'}
          </button>
        </div>

        {/* OwnTracks toggle for logged-in users */}
        {user && (
          <div className={controlItemClass}>
            <TrackingToggle className={floatingButtonClass} />
          </div>
        )}
      </div>

      {/* Top Right: Native Layers Control is at top: 10px, right: 10px.
          We place our controls under it with enough gap. */}
      <div
        className={`${controlContainerClass} top-[66px] right-[12px] items-end gap-2`}
      >
        {isEditor && (
          <div className={controlItemClass}>
            <NewNodeButton
              className={floatingButtonClass}
              onClick={() => setShowCoordModal(true)}
            />
          </div>
        )}

        <div className={controlItemClass}>
          <LocateButton
            className={floatingButtonClass}
            onEdit={onLocateEdit}
            setPosition={setLocatePosition}
            setAccuracy={setLocateAccuracy}
          />
        </div>

        <div className={controlItemClass}>
          <FullscreenButton
            targetId="app-shell"
            className={floatingButtonClass}
          />
        </div>

        <div className={controlItemClass}>
          <HydrantListModal className={floatingButtonClass} features={features} />
        </div>

        <div className={controlItemClass}>
          <LegendModal className={floatingButtonClass} />
        </div>

        {isAdmin && activeAdf && (
          <div className={controlItemClass}>
            <SyncButton className={floatingButtonClass} />
          </div>
        )}
      </div>

      {/* Bottom Left: Zoom Display (Above Attribution if it were there, but on the left).
          On mobile it sits above the bottomsheet bar (60px), aligned with the attribution. */}
      <div className={`${controlContainerClass} bottom-[60px] lg:bottom-[5px] left-[5px]`}>
        <div className={controlItemClass}>
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
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-white/80 px-4 py-2 rounded-[20px] z-[990] shadow-[0_2px_5px_rgba(0,0,0,0.2)] text-[0.8rem] pointer-events-none">
          Actualitzant hidrants...
        </div>
      )}

      {hidrantsError && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-red-700/80 text-white px-4 py-2 rounded-lg z-[990] text-[0.8rem]">
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
