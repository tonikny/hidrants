import { ICONS_H } from './metrics';

export function NodeHeader({ onEdit, showDelete }: { onEdit?: () => void; showDelete?: boolean }) {
  return (
    <div
      className="flex items-center justify-between px-3 border-b border-soft"
      style={{ height: ICONS_H }}
    >
      <span className="font-semibold text-[0.9rem] text-ink">Informació del node</span>
      <div className="flex items-center gap-1">
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="bg-transparent border-0 cursor-pointer text-[0.85rem] text-primary flex items-center gap-1 px-1"
          >
            ✏️ Editar
          </button>
        )}
        {showDelete && (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('node-delete-request'))}
            className="bg-transparent border-0 cursor-pointer text-[0.85rem] text-[#c0392b] flex items-center gap-1 px-1"
          >
            🗑️ Esborrar
          </button>
        )}
      </div>
    </div>
  );
}