import { useMemo, useState } from "react";
import { residualColor, residualT } from "@/lib/sheaf/palette";
import { seriateIds } from "@/lib/sheaf/kernel";
import { useSheaf } from "@/store/sheaf";
import { useVisible } from "../useVisible";

const CELL = 7;

export function MatrixView() {
  const vis = useVisible();
  const select = useSheaf((s) => s.select);
  const flyTo = useSheaf((s) => s.flyTo);
  const spec = useSheaf((s) => s.spectralPositions);
  const selectedId = vis.selectedId;
  const [hover, setHover] = useState<string | null>(null);

  const { order, lookup, lo, hi, cuts } = useMemo(() => {
    const ids = spec
      ? vis.nodes
          .slice()
          .sort((a, b) => {
            if (a.level !== b.level) return a.level - b.level;
            const pa = spec[a.id];
            const pb = spec[b.id];
            if (!pa || !pb) return a.id.localeCompare(b.id);
            return pa.x - pb.x || pa.z - pb.z || a.id.localeCompare(b.id);
          })
          .map((n) => n.id)
      : seriateIds(vis.nodes, vis.edges);
    const lookup = new Map(ids.map((id, i) => [id, i]));
    const residuals = vis.edges.map((e) => e.residual);
    const lo = residuals.length ? Math.min(...residuals) : 0;
    const hi = residuals.length ? Math.max(...residuals) : 1;
    const lvOf = (id: string) => vis.nodes.find((n) => n.id === id)?.level ?? 0;
    const cuts: number[] = [];
    for (let i = 1; i < ids.length; i++) {
      if (lvOf(ids[i]!) !== lvOf(ids[i - 1]!)) cuts.push(i);
    }
    return { order: ids, lookup, lo, hi, cuts };
  }, [vis.nodes, vis.edges, spec]);

  const n = order.length;
  const size = Math.max(n * CELL, 8);
  const titleOf = (id: string) => vis.nodes.find((nd) => nd.id === id)?.title ?? id;
  const hoveredEdge = hover
    ? vis.edges.find((e) => `${e.source}|${e.target}` === hover)
    : null;

  return (
    <div className="flex h-full min-h-0 flex-col bg-bg px-3 pb-36 pt-24 md:px-6 md:pr-[22rem] md:pl-60" data-testid="matrix-view">
      <div className="mb-3 max-w-3xl">
        <p className="font-display text-xl">Restriction matrix</p>
        <p className="mt-1 text-sm leading-relaxed text-fg-muted">
          Stalks seriated by residual-weighted Fiedler order, grouped by layer. Colour is
          restriction residual — teal glues, terracotta fails. This is the 2D review the
          lattice cannot screenshot.
        </p>
        {hoveredEdge ? (
          <p className="mt-2 font-mono text-[11px] text-fg">
            {titleOf(hoveredEdge.source)} → {titleOf(hoveredEdge.target)} · {hoveredEdge.restrictKind} · {hoveredEdge.residual.toFixed(3)}
          </p>
        ) : (
          <p className="mt-2 text-[11px] text-fg-subtle">Hover a cell. Click to inspect that restriction.</p>
        )}
      </div>
      <div className="sheaf-scroll min-h-0 flex-1 overflow-auto rounded-2xl border border-line bg-bg-elev p-3">
        <svg
          width={size + 8}
          height={size + 8}
          viewBox={`0 0 ${size + 8} ${size + 8}`}
          role="img"
          aria-label="Bertin matrix of restriction residuals"
        >
          <rect x={4} y={4} width={size} height={size} fill="var(--color-bg-soft)" opacity={0.45} />
          {cuts.map((c) => (
            <g key={c}>
              <line
                x1={4 + c * CELL}
                y1={4}
                x2={4 + c * CELL}
                y2={4 + size}
                stroke="var(--color-line-strong)"
                strokeWidth={1}
              />
              <line
                x1={4}
                y1={4 + c * CELL}
                x2={4 + size}
                y2={4 + c * CELL}
                stroke="var(--color-line-strong)"
                strokeWidth={1}
              />
            </g>
          ))}
          {vis.edges.map((e) => {
            const i = lookup.get(e.source);
            const j = lookup.get(e.target);
            if (i == null || j == null) return null;
            const t = residualT(e.residual, lo, hi);
            const active =
              e.source === selectedId ||
              e.target === selectedId ||
              hover === `${e.source}|${e.target}`;
            return (
              <rect
                key={e.id}
                x={4 + i * CELL}
                y={4 + j * CELL}
                width={CELL - 1}
                height={CELL - 1}
                rx={1}
                fill={residualColor(t)}
                opacity={active ? 1 : 0.82}
                stroke={active ? "var(--color-fg)" : "none"}
                strokeWidth={active ? 1 : 0}
                className="cursor-pointer"
                onMouseEnter={() => setHover(`${e.source}|${e.target}`)}
                onMouseLeave={() => setHover(null)}
                onClick={() => {
                  select(e.source);
                  flyTo(e.source);
                }}
              >
                <title>{`${titleOf(e.source)} → ${titleOf(e.target)} (${e.restrictKind} ${e.residual.toFixed(3)})`}</title>
              </rect>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
