import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { useAdf } from '../../contexts/AdfContext';

interface SyncButtonProps {
  style?: React.CSSProperties;
}

interface SyncStats {
  SYNCED: number;
  PENDING_CREATE: number;
  PENDING_UPDATE: number;
  PENDING_DELETE: number;
  total_pending: number;
}

export function SyncButton({ style }: SyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [stats, setStats] = useState<SyncStats | null>(null);
  const { activeAdf } = useAdf();

  const fetchStats = async () => {
    if (!activeAdf) return;
    try {
      const response = await fetch(`/api/hidrants/stats?adf=${activeAdf.id}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching sync stats:', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [activeAdf?.id]);

  const handleSync = async () => {
    if (isSyncing || !activeAdf) return;

    if (stats && stats.total_pending > 0) {
      const msg = `Atenció: Tens ${stats.total_pending} canvis pendents (Nous: ${stats.PENDING_CREATE}, Edits: ${stats.PENDING_UPDATE}, Esborrats: ${stats.PENDING_DELETE}).\n\nSi sincronitzes ara de baixada, les dades d'OSM podrien sobreescriure alguns canvis si localment són més antics.\n\nVols continuar amb la sincronització des d'OSM?`;
      if (!window.confirm(msg)) return;
    }
    
    setIsSyncing(true);
    const toastId = toast.loading('Sincronitzant amb OSM...');
    
    try {
      const response = await fetch(`/api/hidrants/sync?adf=${activeAdf.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
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
      
      // Actualitzem les estadístiques després de la sincronització
      await fetchStats();
      
      // Recarreguem la pàgina per veure els canvis
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

  const getTitle = () => {
    if (!stats || stats.total_pending === 0) return "Sincronitzar amb OSM (Baixada)";
    return `Sincronitzar amb OSM\nCanvis pendents de pujar: ${stats.total_pending}\n(N:${stats.PENDING_CREATE}, E:${stats.PENDING_UPDATE}, B:${stats.PENDING_DELETE})`;
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={handleSync}
        disabled={isSyncing}
        title={getTitle()}
        style={{
          ...style,
          cursor: isSyncing ? 'not-allowed' : 'pointer',
          opacity: isSyncing ? 0.7 : 1,
        }}
      >
        <span>{isSyncing ? '⏳' : '🔄'}</span>
      </button>
      
      {stats && stats.total_pending > 0 && !isSyncing && (
        <div
          style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            background: stats.PENDING_CREATE > 0 ? '#f1c40f' : '#3498db',
            color: 'white',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            fontSize: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          {stats.total_pending}
        </div>
      )}
    </div>
  );
}
