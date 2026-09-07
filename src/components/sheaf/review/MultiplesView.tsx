import { residualColor, residualT, levelHex } from "@/lib/sheaf/palette";
import { useSheaf } from "@/store/sheaf";
import { useVisible } from "../useVisible";

export function MultiplesView() {
  const vis = useVisible();
  const levels = useSheaf((s) => s.levels);
  const maxLevel = useSheaf((s) => s.maxLevel);
  const positions = useSheaf((s) => s.positions);
  const select = useSheaf((s) => s.select);
  const flyTo = useSheaf((s) => s.flyTo);
  const selectedId = vis.selectedId;
  const hoveredId = vis.hoveredId;
  const hover = useSheaf((s) => s.hover);

  const residuals = vis.edges.map((e) => e.residual);
  const lo = residuals.length ? Math.min(...residuals) : 0;
  const hi = residuals.length ? Math.max(...residuals) : 1;

  return (
    <div
      className="grid h-full grid-cols-1 gap-3 overflow-auto bg-bg px-3 pb-36 pt-24 sm:grid-cols-2 md:px-6 md:pr-[22rem] md:pl-56"
      data-testid="multiples-view"
    >
      {levels
        .filter((lv) => lv.id <= maxLevel)
        .map((lv) => {
          const group = vis.nodes.filter((n) => n.level === lv.id);
          const xs = group.map((n) => positions[n.id]?.x ?? 0);
          const zs = group.map((n) => positions[n.id]?.z ?? 0);
          const minX = Math.min(...xs, -1);
          const maxX = Math.max(...xs, 1);
          const minZ = Math.min(...zs, -1);
          const maxZ = Math.max(...zs, 1);
          const dx = maxX - minX || 1;
          const dz = maxZ - minZ || 1;
          const pad = 18;
          const W = 320;
          const H = 260;
          const sx = (x: number) => pad + ((x - minX) / dx) * (W - pad * 2);
          const sy = (z: number) => pad + ((z - minZ) / dz) * (H - pad * 2);
          const intra = vis.edges.filter((e) => {
            const a = vis.nodes.find((n) => n.id === e.source);
            const b = vis.nodes.find((n) => n.id === e.target);
            return a?.level === lv.id && b?.level === lv.id;
          });
          return (
            <section key={lv.id} className="sheaf-panel flex flex-col rounded-2xl p-3">
              <header className="mb-2 flex items-baseline justify-between gap-2">
                <h2 className="font-display text-lg">
                  L{lv.id} {lv.label}
                </h2>
                <span className="font-mono text-[11px] text-fg-subtle">{group.length}</span>
              </header>
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${lv.label} slice`}>
                {intra.map((e) => {
                  const a = positions[e.source];
                  const b = positions[e.target];
                  if (!a || !b) return null;
                  return (
                    <line
                      key={e.id}
                      x1={sx(a.x)}
                      y1={sy(a.z)}
                      x2={sx(b.x)}
                      y2={sy(b.z)}
                      stroke={residualColor(residualT(e.residual, lo, hi))}
                      strokeWidth={1.4}
                      opacity={0.7}
                    />
                  );
                })}
                {group.map((n) => {
                  const p = positions[n.id];
                  if (!p) return null;
                  const active = n.id === selectedId || n.id === hoveredId;
                  return (
                    <g key={n.id}>
                      <circle
                        cx={sx(p.x)}
                        cy={sy(p.z)}
                        r={active ? 7 : n.known ? 5.5 : 4.2}
                        fill={levelHex(n.level)}
                        stroke={active ? "var(--color-fg)" : "transparent"}
                        strokeWidth={1.2}
                        className="cursor-pointer"
                        onMouseEnter={() => hover(n.id)}
                        onMouseLeave={() => hover(null)}
                        onClick={() => {
                          select(n.id);
                          flyTo(n.id);
                        }}
                      >
                        <title>{n.title}</title>
                      </circle>
                      {active ? (
                        <text
                          x={sx(p.x) + 8}
                          y={sy(p.z) + 3}
                          fill="var(--color-fg)"
                          fontSize="10"
                        >
                          {n.title.slice(0, 28)}
                        </text>
                      ) : null}
                    </g>
                  );
                })}
              </svg>
            </section>
          );
        })}
    </div>
  );
}
