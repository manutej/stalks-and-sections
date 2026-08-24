import { useMemo } from "react";
import { nodeMeanResidual } from "@/lib/sheaf/energy";
import { residualT } from "@/lib/sheaf/palette";
import { useSheaf } from "@/store/sheaf";

export function useVisible() {
  const nodes = useSheaf((s) => s.nodes);
  const edges = useSheaf((s) => s.edges);
  const maxLevel = useSheaf((s) => s.maxLevel);
  const filterNoise = useSheaf((s) => s.filterNoise);
  const noiseCut = useSheaf((s) => s.noiseCut);
  const search = useSheaf((s) => s.search);
  const selectedId = useSheaf((s) => s.selectedId);
  const hoveredId = useSheaf((s) => s.hoveredId);

  return useMemo(() => {
    const q = search.trim().toLowerCase();
    const residuals = edges.map((e) => e.residual).filter((r) => Number.isFinite(r));
    const lo = residuals.length ? Math.min(...residuals) : 0;
    const hi = residuals.length ? Math.max(...residuals) : 1;
    const cut = lo + noiseCut * (hi - lo);

    const nodeOk = new Set(
      nodes
        .filter((n) => n.level <= maxLevel)
        .filter((n) => {
          if (!q) return true;
          return (
            n.title.toLowerCase().includes(q) ||
            n.id.toLowerCase().includes(q) ||
            (n.aliases ?? []).some((a) => a.toLowerCase().includes(q))
          );
        })
        .map((n) => n.id),
    );

    if (q && selectedId) nodeOk.add(selectedId);

    const visEdges = edges.filter((e) => {
      if (!nodeOk.has(e.source) || !nodeOk.has(e.target)) return false;
      if (filterNoise && e.residual > cut) return false;
      return true;
    });

    const visNodes = nodes.filter((n) => nodeOk.has(n.id));
    const meanRes = new Map(
      visNodes.map((n) => [n.id, nodeMeanResidual(n.id, visEdges)]),
    );

    return {
      nodes: visNodes,
      edges: visEdges,
      lo,
      hi,
      cut,
      meanRes,
      tOf: (r: number) => residualT(r, lo, hi),
      selectedId,
      hoveredId,
    };
  }, [
    nodes,
    edges,
    maxLevel,
    filterNoise,
    noiseCut,
    search,
    selectedId,
    hoveredId,
  ]);
}
