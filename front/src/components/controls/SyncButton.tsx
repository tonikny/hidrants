import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAdf } from '../../contexts/AdfContext';
import { logError } from '../../utils/log';

interface SyncButtonProps {
  className?: string;
  label?: string;
}

interface SyncStats {
  SYNCED: number;
  PENDING_CREATE: number;
  PENDING_UPDATE: number;
  PENDING_DELETE: number;
  total_pending: number;
}

export function SyncButton({ className, label }: SyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [stats, setStats] = useState<SyncStats | null>(null);
  const { activeAdf } = useAdf();

  const fetchStats = async () => {
    if (!activeAdf) {return;}
    try {
      const response = await fetch(`/api/hidrants/stats?adf=${activeAdf.id}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      logError('Error fetching sync stats', err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- càrrega asíncrona legítima
    void fetchStats();
  }, [activeAdf?.id]);

  const handleSync = async () => {
    if (isSyncing || !activeAdf) {return;}

    if (stats && stats.total_pending > 0) {
      const msg = `Atenció: Tens ${stats.total_pending} canvis pendents (Nous: ${stats.PENDING_CREATE}, Edits: ${stats.PENDING_UPDATE}, Esborrats: ${stats.PENDING_DELETE}).\n\nSi sincronitzes ara de baixada, les dades d'OSM podrien sobreescriure alguns canvis si localment són més antics.\n\nVols continuar amb la sincronització des d'OSM?`;
      if (!window.confirm(msg)) {return;}
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
      
    } catch (err) {
      toast.update(toastId, {
        render: `Error sincronitzant: ${err instanceof Error ? err.message : String(err)}`,
        type: 'error',
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const getTitle = () => {
    if (!stats || stats.total_pending === 0) {return "Sincronitzar amb OSM (Baixada)";}
    return `Sincronitzar amb OSM\nCanvis pendents de pujar: ${stats.total_pending}\n(N:${stats.PENDING_CREATE}, E:${stats.PENDING_UPDATE}, B:${stats.PENDING_DELETE})`;
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => { void handleSync(); }}
        disabled={isSyncing}
        title={getTitle()}
        className={`${className || ''} disabled:cursor-not-allowed disabled:opacity-70`}
      >
        <span>{isSyncing ? '⏳' : '🔄'}</span>
        {label && <span>{label}</span>}
      </button>

      {stats && stats.total_pending > 0 && !isSyncing && (
        <div
          className={`absolute -top-[5px] -right-[5px] text-white rounded-full w-[18px] h-[18px] text-[10px] flex items-center justify-center font-bold shadow-[0_1px_3px_rgba(0,0,0,0.3)] pointer-events-none z-10 ${stats.PENDING_CREATE > 0 ? 'bg-[#f1c40f]' : 'bg-[#3498db]'}`}
        >
          {stats.total_pending}
        </div>
      )}
    </div>
  );
}
