import { useState } from 'react';
import { floatingButtonClass } from '../../styles/uiStyles';

export function FullscreenButton({
  targetId,
  className
}: Readonly<{
  targetId: string;
  className?: string;
}>) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    const target = document.getElementById(targetId);
    if (!target) {return;}

    if (!document.fullscreenElement) {
      void target.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      void document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  return (
    <button
      onClick={toggleFullscreen}
      className={className || floatingButtonClass}
      title={isFullscreen ? 'Sortir de pantalla completa' : 'Pantalla completa'}
    >
      {isFullscreen ? '⤫' : '⛶'}
    </button>
  );
}
