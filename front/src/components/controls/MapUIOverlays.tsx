import { FullscreenButton } from "./FullscreenButton";
import { LocateButton } from "./LocateButton";
import { ZoomDisplay } from "./ZoomDisplay";
import {
  floatingButtonClass,
  controlContainerClass,
  controlItemClass,
} from "../../styles/uiStyles";

interface MapUIOverlaysProps {
  setLocatePosition: (latlng: L.LatLng | null) => void;
  setLocateAccuracy?: (accuracy: number | null) => void;
  loadingHidrants: boolean;
  hidrantsError: string | null;
}

export function MapUIOverlays({
  setLocatePosition,
  setLocateAccuracy,
  loadingHidrants,
  hidrantsError,
}: MapUIOverlaysProps) {
  return (
    <>
      {/* Top Right: Native Layers Control is at top: 10px, right: 10px.
          We place our controls under it with enough gap. */}
      <div className={`${controlContainerClass} top-18 right-3 items-end gap-2`}>
        <div className={controlItemClass}>
          <LocateButton
            className={floatingButtonClass}
            setPosition={setLocatePosition}
            setAccuracy={setLocateAccuracy}
          />
        </div>

        <div className={controlItemClass}>
          <FullscreenButton targetId="app-shell" className={floatingButtonClass} />
        </div>
      </div>

      {/* Bottom Left: Zoom Display (Above Attribution if it were there, but on the left).
          On mobile it sits above the bottomsheet bar (60px), aligned with the attribution. */}
      <div className={`${controlContainerClass} bottom-15 lg:bottom-1.25 left-1.25`}>
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
    </>
  );
}
