import { kindLabel } from "@/lib/sheaf/palette";
import { useSheaf } from "@/store/sheaf";

export function HoverChip() {
  const hoveredId = useSheaf((s) => s.hoveredId);
  const selectedId = useSheaf((s) => s.selectedId);
  const nodes = useSheaf((s) => s.nodes);
  const id = hoveredId && hoveredId !== selectedId ? hoveredId : null;
  const node = id ? nodes.find((n) => n.id === id) : null;
  if (!node) return null;
  return (
    <div className="pointer-events-none absolute bottom-36 left-1/2 z-20 hidden -translate-x-1/2 md:block">
      <div className="sheaf-panel rounded-lg px-3 py-1.5 text-center">
        <p className="text-sm">{node.title}</p>
        <p className="text-[11px] text-fg-muted">
          {kindLabel(node.kind)} · L{node.level} · dim {node.dim}
        </p>
      </div>
    </div>
  );
}
