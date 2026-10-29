import { ICONS_H } from "./metrics";

export function NodeHeader({
  onEdit,
  onClose,
  title,
  editing,
}: {
  onEdit?: () => void;
  onClose?: () => void;
  title?: string;
  editing?: boolean;
}) {
  const handleEditClick = () => {
    if (!onEdit) {
      return;
    }
    onEdit();
  };

  const handleCloseClick = () => {
    if (!onClose) {
      return;
    }
    onClose();
  };

  const buttonClass =
    "bg-transparent border-0 cursor-pointer text-[0.85rem] flex items-center gap-1 px-1";

  return (
    <div
      className="flex items-center justify-between px-3 border-b border-soft"
      style={{ height: ICONS_H }}
    >
      <span className="font-semibold text-[0.9rem] text-ink">{title ?? "Informació del node"}</span>
      <div className="flex items-center gap-1">
        {editing ? (
          onEdit && (
            <button
              type="button"
              onClick={handleEditClick}
              className={buttonClass}
              style={{ color: "#c0392b" }}
            >
              ✖ Tancar
            </button>
          )
        ) : (
          <>
            {onEdit && (
              <button
                type="button"
                onClick={handleEditClick}
                className={buttonClass}
                style={{ color: "#007bff" }}
              >
                ✏️ Editar
              </button>
            )}
            {onClose && (
              <button
                type="button"
                onClick={handleCloseClick}
                className={buttonClass}
                style={{ color: "#c0392b" }}
              >
                ✖ Tancar
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
