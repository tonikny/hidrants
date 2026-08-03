import type { PanelTab } from './types';
import { ICONS_H } from './metrics';

export function TabBar({
  tabs,
  activeId,
  onSelect,
  showLabels,
}: {
  tabs: PanelTab[];
  activeId: string;
  onSelect: (id: string) => void;
  showLabels: boolean;
}) {
  return (
    <div className="flex w-full border-b border-soft" style={{ height: ICONS_H }}>
      {tabs.map((t) => (
        <button
          key={t.id}
          data-tab={t.id}
          onClick={() => onSelect(t.id)}
          className={`flex-1 flex flex-col items-center justify-center gap-[2px] bg-transparent border-0 cursor-pointer ${
            activeId === t.id ? 'text-primary font-semibold' : 'text-muted'
          }`}
        >
          <span className="text-[1.15rem] leading-none">{t.icon}</span>
          {showLabels && <span className="text-[0.7rem] leading-none">{t.label}</span>}
        </button>
      ))}
    </div>
  );
}