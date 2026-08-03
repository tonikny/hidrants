import { useAuth } from '../../../contexts/AuthContext';
import { useAdf } from '../../../contexts/AdfContext';
import { SyncButton } from '../../controls/SyncButton';

export function MapaTab() {
  const { adfs, isLoading, activeAdf, setActiveAdf } = useAdf();
  const { user } = useAuth();

  if (isLoading) {
    return <div className="text-center p-8 text-muted text-[0.85rem]">Carregant ADFs...</div>;
  }

  return (
    <div className="p-4">
      <h3 className="m-0 mb-1 text-[0.95rem] font-semibold">Escull àmbit territorial</h3>
      <div className="border border-border rounded overflow-hidden mt-2">
        {adfs.map((adf) => (
          <button
            key={adf.id}
            onClick={() => setActiveAdf(adf)}
            className={`w-full text-left px-4 py-3 flex items-center gap-2 border-b border-soft last:border-b-0 cursor-pointer text-[0.9rem] transition-colors ${
              activeAdf?.id === adf.id
                ? 'bg-[#e3f2fd] text-ink font-semibold'
                : 'bg-white text-ink'
            }`}
          >
            <span className={activeAdf?.id === adf.id ? 'text-primary' : 'text-muted'}>-</span>
            <span>{adf.nom}</span>
          </button>
        ))}
      </div>

      {user?.role === 'admin' && (
        <div className="mt-4">
          <h4 className="m-0 mb-2 text-[0.85rem] font-semibold">Sincronització amb OSM</h4>
          <SyncButton
            label="Sincronitzar amb OSM"
            className="w-full bg-white text-ink border border-border rounded cursor-pointer p-2 flex items-center justify-center gap-2 text-[0.9rem]"
          />
          <p className="text-muted text-[0.8rem] mt-2 mb-0">
            Descarrega les dades d'OSM cap a l'app. Els canvis locals pendents podrien sobreescriure's si són més antics que els d'OSM.
          </p>
        </div>
      )}
    </div>
  );
}
