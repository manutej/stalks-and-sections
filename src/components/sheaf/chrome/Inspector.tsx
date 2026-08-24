import { X } from "lucide-react";
import { StalkPlot } from "../canvas/StalkPlot";
import { kindLabel, RESTRICT_LABEL, residualColor } from "@/lib/sheaf/palette";
import { useSheaf } from "@/store/sheaf";
import { useVisible } from "../useVisible";
import { Hint } from "./Hint";

export function Inspector({ className = "" }: { className?: string }) {
  const nodes = useSheaf((s) => s.nodes);
  const edges = useSheaf((s) => s.edges);
  const selectedId = useSheaf((s) => s.selectedId);
  const proof = useSheaf((s) => s.proof);
  const energy = useSheaf((s) => s.energy);
  const dataset = useSheaf((s) => s.dataset);
  const select = useSheaf((s) => s.select);
  const vis = useVisible();
  const levels = useSheaf((s) => s.levels);
  const node = nodes.find((n) => n.id === selectedId) ?? null;

  const nbrs = node
    ? edges
        .filter((e) => e.source === node.id || e.target === node.id)
        .map((e) => {
          const otherId = e.source === node.id ? e.target : e.source;
          const other = nodes.find((n) => n.id === otherId);
          return { e, other };
        })
        .filter((x) => x.other)
    : [];

  return (
    <aside
      className={`sheaf-panel sheaf-scroll flex flex-col overflow-hidden rounded-2xl ${className}`}
    >
      <div className="flex items-start justify-between gap-2 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-fg-subtle">Inspector</p>
          <p className="font-display text-lg leading-tight">{node ? node.title : "Lattice"}</p>
          {node ? (
            <p className="mt-1 text-[11px] text-fg-muted">
              {kindLabel(node.kind)} · {levels.find((l) => l.id === node.level)?.label ?? `L${node.level}`} · dim {node.dim}
              {node.known ? " · pinned" : " · free"}
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-fg-muted">
              Click a named node to open it. Close, Esc, or an empty plane returns.
            </p>
          )}
        </div>
        {node ? (
          <button
            type="button"
            onClick={() => select(null)}
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-fg px-3 text-sm font-medium text-bg"
            aria-label="Close"
          >
            <X className="size-4" />
            Close
          </button>
        ) : (
          <Hint k="close" side="left" />
        )}
      </div>

      <div className="sheaf-scroll min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {node ? (
          <>
            <StalkPlot node={node} />
            <p className="mt-2 text-[12px] leading-relaxed text-fg-muted">{node.summary}</p>
            {node.arxiv ? (
              <p className="mt-2 font-mono text-[11px] text-fg-subtle">arXiv:{node.arxiv}</p>
            ) : null}
            {node.sources.length ? (
              <p className="mt-1 text-[11px] text-fg-subtle">
                Sources {node.sources.join(" · ")}
              </p>
            ) : null}

            <h3 className="mt-4 text-[10px] uppercase tracking-wider text-fg-subtle">
              Neighbours & residuals
            </h3>
            <ul className="mt-2 space-y-1">
              {nbrs.map(({ e, other }) => {
                const t = vis.tOf(e.residual);
                return (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => select(other!.id)}
                      className="w-full rounded-lg px-1.5 py-1.5 text-left hover:bg-bg-soft"
                    >
                      <div className="flex items-baseline justify-between gap-2 text-[12px]">
                        <span className="truncate font-medium">{other!.title}</span>
                        <span className="tabular font-mono text-[11px] text-fg-muted">
                          {e.residual.toFixed(3)}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-bg-soft">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, 8 + t * 92)}%`,
                            background: residualColor(t),
                          }}
                        />
                      </div>
                      <p className="mt-0.5 text-[10px] text-fg-subtle">
                        {e.relation} · {RESTRICT_LABEL[e.restrictKind]} · dim {e.edgeDim}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <ProofBlock proof={proof} energy={energy} dataset={dataset} />
        )}
      </div>
    </aside>
  );
}

function ProofBlock({
  proof,
  energy,
  dataset,
}: {
  proof: ReturnType<typeof useSheaf.getState>["proof"];
  energy: number;
  dataset: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1">
        <h3 className="text-[10px] uppercase tracking-wider text-fg-subtle">Dirichlet energy</h3>
        <Hint k="energy" />
      </div>
      <p className="tabular font-display text-3xl leading-none">{energy.toFixed(3)}</p>
      <p className="mt-2 text-[12px] leading-relaxed text-fg-muted">
        {dataset === "cobb"
          ? "Cobb–Gebhart seed. Diffuse runs the Euler scheme; Exact solve is Theorem 3.1."
          : "Literature lattice with variable-dimension stalks. Diffuse descends the sheaf Laplacian; Coarsen pools it."}
      </p>
      {proof ? (
        <dl className="mt-4 grid grid-cols-2 gap-2 text-[12px]">
          <Stat label="Before" value={proof.energyBefore.toFixed(3)} />
          <Stat label="After" value={proof.energyAfter.toFixed(3)} />
          <Stat label="Iters" value={String(proof.iters)} />
          <Stat label="Boundary drift" value={proof.boundaryDrift.toExponential(1)} />
          <Stat label="Energy rises" value={String(proof.energyIncreases)} />
          {proof.unique != null ? (
            <Stat label="Unique H⁰" value={proof.unique ? "yes" : "pinv"} />
          ) : null}
        </dl>
      ) : (
        <p className="mt-4 text-[12px] text-fg-muted">
          Run Diffuse to watch energy fall and free stalks settle onto the pinned boundary.
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-bg-soft px-2.5 py-2">
      <dt className="text-[10px] uppercase tracking-wider text-fg-subtle">{label}</dt>
      <dd className="tabular font-mono text-sm">{value}</dd>
    </div>
  );
}
