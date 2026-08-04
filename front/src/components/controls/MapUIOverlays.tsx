import { FullscreenButton } from './FullscreenButton';
import { NewNodeButton } from './NewNodeButton';
import { CoordinateModal } from '../shared/CoordinateModal';
import { LocateButton } from './LocateButton';
import { ZoomDisplay } from './ZoomDisplay';
import { Modal } from '../shared/Modal';
import type { User } from '../../contexts/AuthContext';
import {
  floatingButtonClass,
  controlContainerClass,
  controlItemClass,
} from '../../styles/uiStyles';

interface MapUIOverlaysProps {
  user: User | null;
  showCoordModal: boolean;
  setShowCoordModal: (show: boolean) => void;
  onCoordinateConfirm: (lat: number, lon: number) => void;
  setLocatePosition: (latlng: L.LatLng | null) => void;
  setLocateAccuracy?: (accuracy: number | null) => void;
  loadingHidrants: boolean;
  hidrantsError: string | null;
}

export function MapUIOverlays({
  user,
  showCoordModal,
  setShowCoordModal,
  onCoordinateConfirm,
  setLocatePosition,
  setLocateAccuracy,
  loadingHidrants,
  hidrantsError,
}: MapUIOverlaysProps) {
  const isEditor = user?.role === 'admin' || user?.role === 'editor';

  return (
    <>
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
      </div>

      {/* Bottom Left: Zoom Display (Above Attribution if it were there, but on the left).
          On mobile it sits above the bottomsheet bar (60px), aligned with the attribution. */}
      <div className={`${controlContainerClass} bottom-[60px] lg:bottom-[5px] left-[5px]`}>
        <div className={controlItemClass}>
          <ZoomDisplay />
        </div>
      </div>

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
