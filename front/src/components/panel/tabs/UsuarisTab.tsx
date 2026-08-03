import { useAuth } from '../../../contexts/AuthContext';
import { useAdf } from '../../../contexts/AdfContext';
import { Login } from '../../shared/Login';
import { secondaryButtonClass } from '../../../styles/uiStyles';

export function UsuarisTab() {
  const { user, logout } = useAuth();
  const { activeAdf } = useAdf();

  if (!user) {
    return (
      <div className="p-4">
        <Login />
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="m-0 mb-2 text-[0.95rem] font-semibold">Usuari</h3>
      <div className="border border-border rounded p-3 bg-soft">
        <div className="font-semibold text-ink">{user.username}</div>
        <div className="text-muted text-[0.8rem] capitalize mt-[2px]">{user.role}</div>
        {activeAdf && <div className="text-muted text-[0.8rem] mt-[2px]">ADF: {activeAdf.nom}</div>}
      </div>
      <button onClick={logout} className={`${secondaryButtonClass} w-full mt-3`}>
        🔓 Tanca sessió
      </button>
    </div>
  );
}