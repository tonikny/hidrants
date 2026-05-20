import { useState } from 'react';
import { toast } from 'react-toastify';

interface SyncButtonProps {
  style?: React.CSSProperties;
}

export function SyncButton({ style }: SyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    const toastId = toast.loading('Sincronitzant amb OSM...');
    
    try {
      const response = await fetch('/api/hidrants/sync', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      
      const data = await response.json();
      toast.update(toastId, {
        render: data.message || 'Sincronització completada!',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
      
      // Recarreguem la pàgina per veure els canvis (o podríem forçar el refetch del hook)
      setTimeout(() => window.location.reload(), 1000);
      
    } catch (err: any) {
      toast.update(toastId, {
        render: `Error sincronitzant: ${err.message}`,
        type: 'error',
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <button
      onClick={handleSync}
      disabled={isSyncing}
      title="Sincronitzar amb OSM"
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isSyncing ? 'not-allowed' : 'pointer',
        opacity: isSyncing ? 0.7 : 1,
      }}
    >
      <span style={{ fontSize: '1.2rem' }}>{isSyncing ? '⏳' : '🔄'}</span>
    </button>
  );
}
