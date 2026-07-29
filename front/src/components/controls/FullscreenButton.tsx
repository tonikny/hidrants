import { useState } from 'react';
import { floatingButtonStyle } from '../../styles/uiStyles';

export function FullscreenButton({ 
  targetId,
  style
}: Readonly<{ 
  targetId: string;
  style?: React.CSSProperties;
}>) {
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
      style={style || floatingButtonStyle}
      title={isFullscreen ? 'Sortir de pantalla completa' : 'Pantalla completa'}
    >
      {isFullscreen ? '⤫' : '⛶'}
    </button>
  );
}
