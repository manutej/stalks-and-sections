import { X } from "lucide-react";
import { kindLabel } from "@/lib/sheaf/palette";
import { useSheaf } from "@/store/sheaf";

export function CueBar() {
  const selectedId = useSheaf((s) => s.selectedId);
  const hoveredId = useSheaf((s) => s.hoveredId);
  const nodes = useSheaf((s) => s.nodes);
  const levels = useSheaf((s) => s.levels);
  const select = useSheaf((s) => s.select);

  const selected = selectedId ? nodes.find((n) => n.id === selectedId) : null;
  const hovered =
    !selected && hoveredId ? nodes.find((n) => n.id === hoveredId) : null;
  const levelOf = (n: { level: number }) =>
    levels.find((l) => l.id === n.level)?.label ?? `L${n.level}`;

  if (selected) {
    return (
      <div className="pointer-events-none absolute inset-x-0 top-20 z-40 hidden justify-center px-3 md:flex">
        <div className="pointer-events-auto sheaf-panel flex max-w-[min(100%,28rem)] items-center gap-2 rounded-full py-1 pl-3.5 pr-1">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-tight">{selected.title}</p>
            <p className="truncate font-mono text-[10px] text-fg-muted">
              {kindLabel(selected.kind)} · {levelOf(selected)} · click Close to return
            </p>
          </div>
          <button
            type="button"
            onClick={() => select(null)}
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-fg px-3.5 text-sm font-medium text-bg"
            aria-label="Close"
          >
            <X className="size-4" />
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!hovered) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-20 z-20 hidden justify-center px-3 md:flex">
      <div className="sheaf-panel rounded-full px-3.5 py-1.5 text-center">
        <p className="text-sm font-medium">{hovered.title}</p>
        <p className="font-mono text-[10px] text-fg-muted">
          {kindLabel(hovered.kind)} · {levelOf(hovered)} · click to inspect
        </p>
      </div>
    </div>
  );
}
