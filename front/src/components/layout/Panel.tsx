import { useState } from 'react';
import type { ReactNode, Ref } from 'react';
import { TabBar } from './TabBar';
import { NodeHeader } from './NodeHeader';
import { BottomSheet } from './BottomSheet';
import { ICONS_H } from './metrics';
import type { PanelTab, PanelNode, BottomSheetHandle } from './types';

export type { PanelTab, BottomSheetHandle };

interface PanelProps {
  map: ReactNode;
  tabs: PanelTab[];
  node: PanelNode | null;
  sheetRef?: Ref<BottomSheetHandle>;
}

export function Panel({ map, tabs, node, sheetRef }: PanelProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? '');
  const activeContent = tabs.find((t) => t.id === activeTab)?.content;

  return (
    <div id="app-shell" className="h-full w-full">
      <div className="flex h-screen max-h-[100svh] w-full overflow-hidden">
        <div id="map-container" className="flex-1 relative h-full min-w-0">
          {map}
        </div>
        <aside className="hidden lg:block w-[380px] shrink-0 bg-white border-l border-border">
          {node ? (
            <NodeHeader title={node.title} onEdit={node.onEdit} showDelete={node.showDelete} />
          ) : (
            <TabBar tabs={tabs} activeId={activeTab} onSelect={setActiveTab} showLabels />
          )}
          <div className={`h-[calc(100%-44px)] overflow-y-auto ${node ? '' : 'border-t border-soft'}`}>
            {node ? node.content : activeContent}
          </div>
        </aside>
      </div>
      <BottomSheet
        ref={sheetRef}
        tabs={tabs}
        node={node}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />
    </div>
  );
}