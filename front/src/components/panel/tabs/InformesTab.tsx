import type { HidrantFeature } from '../../../hooks/useHidrantData';
import type { IncidenciaFeature } from '../../../types';
import { CollapsibleSection } from '../shared/CollapsibleSection';
import { HydrantList } from '../../lists/HydrantList';
import { IncidenciaList } from '../../lists/IncidenciaList';

export function InformesTab({
  features,
  incidenciaFeatures,
  onSelectNode,
  onSelectIncidencia,
}: {
  features: HidrantFeature[];
  incidenciaFeatures: IncidenciaFeature[];
  onSelectNode?: (feature: HidrantFeature) => void;
  onSelectIncidencia?: (feature: IncidenciaFeature) => void;
}) {
  return (
    <div className="p-4">
      <CollapsibleSection title="Hidrants" count={features.length}>
        <HydrantList features={features} onSelectNode={onSelectNode} />
      </CollapsibleSection>
      <CollapsibleSection title="Incidències" count={incidenciaFeatures.length}>
        <IncidenciaList features={incidenciaFeatures} onSelectIncidencia={onSelectIncidencia} />
      </CollapsibleSection>
    </div>
  );
}