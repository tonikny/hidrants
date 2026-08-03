import type { HidrantFeature } from '../../../hooks/useHidrantData';
import type { IncidenciaFeature } from '../../../types';
import { CollapsibleSection } from '../shared/CollapsibleSection';
import { HydrantList } from '../../lists/HydrantList';
import { IncidenciaList } from '../../lists/IncidenciaList';

export function InformesTab({
  features,
  incidenciaFeatures,
}: {
  features: HidrantFeature[];
  incidenciaFeatures: IncidenciaFeature[];
}) {
  return (
    <div className="p-4">
      <CollapsibleSection title="Hidrants" count={features.length}>
        <HydrantList features={features} />
      </CollapsibleSection>
      <CollapsibleSection title="Incidències" count={incidenciaFeatures.length}>
        <IncidenciaList features={incidenciaFeatures} />
      </CollapsibleSection>
    </div>
  );
}