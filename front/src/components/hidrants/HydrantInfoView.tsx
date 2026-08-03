import type { HidrantFeature } from '../../hooks/useHidrantData';
import { getHydrantDisplayData, getHydrantImages } from '../../utils/osmConversion';
import { HydrantImages } from './HydrantImages';
import { QuickStatusButtons } from './QuickStatusButtons';
import { HydrantActions } from './HydrantActions';
import { TelegramNotifyBox } from './TelegramNotifyBox';

function formatSyncStatus(status: string) {
  switch (status) {
    case 'SYNCED':
      return '🟢 Sincronitzat';
    case 'PENDING_CREATE':
      return '🟡 Pendent de crear (local)';
    case 'PENDING_UPDATE':
      return '🔵 Pendent d\'actualitzar';
    case 'PENDING_DELETE':
      return '🔴 Pendent d\'esborrar';
    default:
      return status;
  }
}

export function HydrantInfoView({
  feature,
  user,
  canEdit,
  showRoute,
  setShowRoute,
  hasLocation,
  onQuickStatus,
}: {
  feature: HidrantFeature;
  user: any;
  canEdit: boolean;
  showRoute?: boolean;
  setShowRoute?: (v: boolean) => void;
  hasLocation?: boolean;
  onQuickStatus: (isOperative: boolean) => void;
}) {
  const props = feature.properties;
  const displayData = getHydrantDisplayData(props.ui_fields);

  return (
    <>
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-3 text-[0.85rem]">
          <div className="flex flex-col items-end gap-y-[6px] text-muted">
            {displayData.map(({ label }) => (
              <span key={label}>{label}</span>
            ))}
            {user?.role === 'admin' && <span>Sync</span>}
          </div>
          <div className="flex flex-col items-start gap-y-[6px] text-ink">
            {displayData.map(({ label, value }) => (
              <span key={label}>{value}</span>
            ))}
            {user?.role === 'admin' && <span>{formatSyncStatus(props.sync_status)}</span>}
          </div>
        </div>
        <HydrantImages images={getHydrantImages(props.osm_tags)} />
      </div>

      {props.private_tags?.observacions && (
        <div className="border border-border rounded p-2">
          <div className="text-[0.75rem] text-muted mb-1">Observacions</div>
          <div className="text-[0.85rem] text-ink whitespace-pre-wrap">
            {props.private_tags.observacions}
          </div>
        </div>
      )}

      {canEdit && (
        <QuickStatusButtons
          onOperative={() => onQuickStatus(true)}
          onOutOfService={() => onQuickStatus(false)}
        />
      )}

      <HydrantActions
        feature={feature}
        showRoute={showRoute}
        setShowRoute={setShowRoute}
        hasLocation={hasLocation}
        user={user}
      />

      <TelegramNotifyBox feature={feature} />
    </>
  );
}