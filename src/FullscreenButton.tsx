import { useState } from 'react';

export function FullscreenButton({ targetId }: { targetId: string }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    const target = document.getElementById(targetId);
    if (!target) return;

    if (!document.fullscreenElement) {
      target.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  return (
    <button
      onClick={toggleFullscreen}
      style={{
        position: 'absolute',
        bottom: '13rem',
        left: '1rem',
        background: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '50%',
        width: '3rem',
        height: '3rem',
        fontSize: '1.5rem',
        cursor: 'pointer',
        zIndex: 1000,
      }}
      title={isFullscreen ? 'Sortir de pantalla completa' : 'Pantalla completa'}
    >
      {isFullscreen ? '⤫' : '⛶'}
    </button>
  );
}
