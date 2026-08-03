import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from 'react';

const HANDLE_H = 16;
const ICONS_H = 44;
const BAR_HEIGHT = HANDLE_H + ICONS_H;

export interface PanelTab {
  id: string;
  icon: string;
  label: string;
  content: ReactNode;
}

export interface BottomSheetHandle {
  close: () => void;
}

interface PanelProps {
  map: ReactNode;
  tabs: PanelTab[];
  node: { content: ReactNode; onClose: () => void; onEdit?: () => void; showDelete?: boolean } | null;
  sheetRef?: React.Ref<BottomSheetHandle>;
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
            <NodeHeader onEdit={node.onEdit} showDelete={node.showDelete} />
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

function TabBar({
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

function NodeHeader({ onEdit, showDelete }: { onEdit?: () => void; showDelete?: boolean }) {
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

function BottomSheetView(
  {
    tabs,
    node,
    activeTab,
    onSelectTab,
  }: {
    tabs: PanelTab[];
    node: { content: ReactNode; onClose: () => void; onEdit?: () => void; showDelete?: boolean } | null;
    activeTab: string;
    onSelectTab: (id: string) => void;
  },
  ref: React.ForwardedRef<BottomSheetHandle>
) {
  const [open, setOpen] = useState(false);
  const [height, setHeight] = useState(BAR_HEIGHT);
  const [snapping, setSnapping] = useState(false);
  const dragRef = useRef<{ startY: number; startH: number; h: number; moved: boolean; handleHit: boolean; tabId: string | null } | null>(null);
  const dragMovedRef = useRef(false);

  const nodeMode = !!node;
  const positions = () => [
    BAR_HEIGHT,
    Math.round(window.innerHeight * 0.6),
    Math.round(window.innerHeight * 0.95),
  ];

  const setSnap = (h: number) => {
    setOpen(h > positions()[0]);
    setHeight(h);
    setSnapping(true);
  };

  useEffect(() => {
    setSnap(node ? positions()[1] : positions()[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node]);

  useImperativeHandle(ref, () => ({
    close() {
      if (node) node.onClose();
      else setSnap(positions()[0]);
    },
  }), [node]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    dragRef.current = {
      startY: e.clientY,
      startH: height,
      h: height,
      moved: false,
      handleHit: !!target.closest('[data-handle]'),
      tabId: target.closest('[data-tab]')?.getAttribute('data-tab') ?? null,
    };
    dragMovedRef.current = false;
    setSnapping(false);
    if (e.pointerType !== 'mouse') {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const delta = d.startY - e.clientY;
    if (!d.moved) {
      if (Math.abs(delta) < 6) return;
      d.moved = true;
      dragMovedRef.current = true;
    }
    const next = Math.max(BAR_HEIGHT, Math.min(d.startH + delta, positions()[positions().length - 1]));
    d.h = next;
    setHeight(next);
  };

  const endDrag = () => {
    const d = dragRef.current;
    if (!d) return;
    dragRef.current = null;
    if (!d.moved) {
      if (d.tabId) {
        onSelectTab(d.tabId);
        if (!open) setSnap(positions()[1]);
      } else if (d.handleHit) {
        if (nodeMode) node.onClose();
        else setSnap(open ? positions()[0] : positions()[1]);
      }
      return;
    }
    const pos = positions();
    const target = pos.reduce(
      (acc, p) => (Math.abs(p - d.h) < Math.abs(acc - d.h) ? p : acc),
      pos[0]
    );
    if (nodeMode && target === pos[0]) {
      node.onClose();
      return;
    }
    setSnap(target);
  };

  const handleTabSelect = (id: string) => {
    if (dragMovedRef.current) return;
    onSelectTab(id);
    if (!open) setSnap(positions()[1]);
  };

  const activeContent = tabs.find((t) => t.id === activeTab)?.content;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[1000] lg:hidden bg-white border-t border-border rounded-t-xl shadow-[0_-2px_10px_rgba(0,0,0,0.2)]"
      style={{
        height,
        transition: snapping ? 'height 0.25s ease' : 'none',
      }}
    >
      <div
        className="touch-none"
        style={{ height: nodeMode ? HANDLE_H + ICONS_H : BAR_HEIGHT }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div
          data-handle
          className="flex justify-center items-start pt-[3px] select-none cursor-grab"
          style={{ height: HANDLE_H }}
        >
          <span className="h-[3px] w-9 rounded-full bg-faint" aria-hidden />
        </div>
        {nodeMode && node ? (
          <NodeHeader onEdit={node.onEdit} showDelete={node.showDelete} />
        ) : (
          <TabBar tabs={tabs} activeId={activeTab} onSelect={handleTabSelect} showLabels={open} />
        )}
      </div>
      <div className="overflow-y-auto" style={{ height: height - (nodeMode ? HANDLE_H + ICONS_H : BAR_HEIGHT) }}>
        {nodeMode && node ? node.content : activeContent}
      </div>
    </div>
  );
}

const BottomSheet = forwardRef<
  BottomSheetHandle,
  {
    tabs: PanelTab[];
    node: { content: ReactNode; onClose: () => void; onEdit?: () => void; showDelete?: boolean } | null;
    activeTab: string;
    onSelectTab: (id: string) => void;
  }
>(BottomSheetView);
