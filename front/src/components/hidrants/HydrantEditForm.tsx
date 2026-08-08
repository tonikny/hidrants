import type { HydrantUiFields } from '../../utils/osmConversion';
import { HydrantFormFields } from './HydrantFormFields';
import {
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
  dangerButtonClass,
} from '../../styles/uiStyles';

export function HydrantEditForm({
  data,
  setData,
  observacions,
  setObservacions,
  busy,
  onSave,
  onCancel,
  onDelete,
}: {
  data: HydrantUiFields;
  setData: (d: HydrantUiFields) => void;
  observacions: string;
  setObservacions: (o: string) => void;
  busy: boolean;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <HydrantFormFields data={data} onChange={setData} showSurveyDateAndStatus={true} />

      <label className="text-[0.8rem] italic flex flex-col gap-[4px]">
        Observacions:
        <textarea
          value={observacions}
          onChange={(e) => setObservacions(e.target.value)}
          rows={3}
          className={`${inputClass} w-full resize-y text-[0.8rem] p-[6px]`}
          placeholder="Observacions internes de l'hidrant..."
        />
      </label>

      <div className="flex gap-[8px]">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSave();
          }}
          disabled={busy}
          className={`${primaryButtonClass} flex-1 py-[8px] text-[0.8rem] disabled:opacity-70`}
        >
          {busy ? 'Guardant...' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          className={`${secondaryButtonClass} flex-1 py-[8px] text-[0.8rem]`}
        >
          Cancel·lar
        </button>
      </div>

      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          disabled={busy}
          className={`${dangerButtonClass} disabled:opacity-70`}
        >
          🗑️ Esborrar hidrant
        </button>
      )}
    </div>
  );
}