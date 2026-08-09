import type { ReactNode } from "react";
import { useState } from "react";

export function CollapsibleSection({
  title,
  count,
  defaultOpen = false,
  children,
}: {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-transparent border-0 cursor-pointer p-0 m-0 text-[0.95rem] font-semibold text-ink"
      >
        <span>
          {title}
          {count !== undefined ? ` (${count})` : ""}
        </span>
        <span className="text-muted text-[0.8rem]">{open ? "▾" : "▸"}</span>
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}
