import { canEnterRoom } from "@/lib/sheaf/room";
import { kindLabel } from "@/lib/sheaf/palette";
import { useSheaf } from "@/store/sheaf";

export function CueBar() {
  const selectedId = useSheaf((s) => s.selectedId);
  const hoveredId = useSheaf((s) => s.hoveredId);
  const nodes = useSheaf((s) => s.nodes);
  const edges = useSheaf((s) => s.edges);
  const rooms = useSheaf((s) => s.rooms);
  const levels = useSheaf((s) => s.levels);
  const roomPath = useSheaf((s) => s.roomPath);

  const selected = selectedId ? nodes.find((n) => n.id === selectedId) : null;
  const hovered =
    !selected && hoveredId ? nodes.find((n) => n.id === hoveredId) : null;
  const levelOf = (n: { level: number }) =>
    levels.find((l) => l.id === n.level)?.label ?? `L${n.level}`;
  const top = roomPath.length ? "top-32" : "top-20";

  // Inspector already names the open stalk. CueBar is hover-only so it
  // does not stack a second title over the lattice labels.
  if (selected || !hovered) return null;
  const hoverEnter = canEnterRoom(hovered, edges, rooms);

  return (
    <div className={`pointer-events-none absolute inset-x-0 ${top} z-20 hidden justify-center px-3 md:flex`}>
      <div className="sheaf-panel rounded-full px-3.5 py-1.5 text-center">
        <p className="text-sm font-medium">{hovered.title}</p>
        <p className="font-mono text-[10px] text-fg-muted">
          {kindLabel(hovered.kind)} · {levelOf(hovered)}
          {hoverEnter ? " · double-click to enter room" : " · click to inspect"}
        </p>
      </div>
    </div>
  );
}
