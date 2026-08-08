import { ICONS_H } from './metrics';
import { confirmDiscardChanges } from '../../utils/formDirty';

export function NodeHeader({
  onEdit,
  title,
  editing,
}: {
  onEdit?: () => void;
  title?: string;
  editing?: boolean;
}) {
  const handleEditClick = () => {
    if (!onEdit) {return;}
    if (editing && !confirmDiscardChanges()) {return;}
    onEdit();
  };

  return (
    <div
      className="flex items-center justify-between px-3 border-b border-soft"
      style={{ height: ICONS_H }}
    >
      <span className="font-semibold text-[0.9rem] text-ink">{title ?? 'Informació del node'}</span>
      <div className="flex items-center gap-1">
        {onEdit && (
          <button
            type="button"
            onClick={handleEditClick}
            className="bg-transparent border-0 cursor-pointer text-[0.85rem] flex items-center gap-1 px-1"
            style={{ color: editing ? '#c0392b' : '#007bff' }}
          >
            {editing ? '✖ Tancar' : '✏️ Editar'}
          </button>
        )}
      </div>
    </div>
  );
}