import { DoorOpen, Undo2, X } from "lucide-react";
import { StalkPlot } from "../canvas/StalkPlot";
import { canEnterRoom } from "@/lib/sheaf/room";
import { reviewSheet } from "@/lib/sheaf/review";
import { kindLabel, RESTRICT_LABEL, residualColor } from "@/lib/sheaf/palette";
import { useSheaf } from "@/store/sheaf";
import { useVisible } from "../useVisible";
import { Explained, Hint } from "./Hint";

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
  const sheafEval = useSheaf((s) => s.eval);
  const flyTo = useSheaf((s) => s.flyTo);
  const maxLevel = useSheaf((s) => s.maxLevel);
  const families = useSheaf((s) => s.families);
  const rooms = useSheaf((s) => s.rooms);
  const enterRoom = useSheaf((s) => s.enterRoom);
  const leaveRoom = useSheaf((s) => s.leaveRoom);
  const roomPath = useSheaf((s) => s.roomPath);
  const residualMeaning = useSheaf((s) => s.residualMeaning);
  const latticeTitle = useSheaf((s) => s.title);
  const latticeKicker = useSheaf((s) => s.kicker);
  const node = nodes.find((n) => n.id === selectedId) ?? null;
  const enterable = canEnterRoom(node, edges, rooms);

  const nbrs = node
    ? edges
        .filter((e) => e.source === node.id || e.target === node.id)
        .map((e) => {
          const otherId = e.source === node.id ? e.target : e.source;
          const other = nodes.find((n) => n.id === otherId);
          return { e, other };
        })
        .filter((x) => x.other)
        .sort((a, b) => (b.e.restrictKind === "type-aware" ? 1 : 0) - (a.e.restrictKind === "type-aware" ? 1 : 0))
    : [];

  return (
    <aside
      className={`sheaf-panel sheaf-scroll flex flex-col overflow-hidden rounded-2xl ${className}`}
    >
      <div className="flex items-start justify-between gap-2 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-fg-subtle">
            {roomPath.length ? `Room · ${roomPath[roomPath.length - 1]?.title}` : node ? "Inspector" : "Review"}
          </p>
          <p className="font-display text-lg leading-tight">{node ? node.title : "Lattice"}</p>
          {node ? (
            <p className="mt-1 text-[11px] text-fg-muted">
              {kindLabel(node.kind)} · {levels.find((l) => l.id === node.level)?.label ?? `L${node.level}`} · dim {node.dim}
              {node.known ? " · pinned" : " · free"}
              {enterable ? " · has interior" : ""}
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-fg-muted">
              Claims and interiors — not every file. Click a terracotta row or a room.
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
          <Hint k="review" side="left" />
        )}
      </div>

      <div className="sheaf-scroll min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {node ? (
          <>
            {enterable || roomPath.length ? (
              <div className="mb-3 flex flex-wrap gap-2">
                {enterable ? (
                  <Explained k="room" side="left">
                    <button
                      type="button"
                      data-testid="enter-room"
                      onClick={() => enterRoom(node.id)}
                      className="flex h-10 items-center gap-1.5 rounded-lg bg-fg px-3 text-xs font-medium text-bg"
                    >
                      <DoorOpen className="size-3.5" />
                      Enter room
                    </button>
                  </Explained>
                ) : null}
                {roomPath.length ? (
                  <button
                    type="button"
                    onClick={leaveRoom}
                    className="flex h-10 items-center gap-1.5 rounded-lg bg-bg-soft px-3 text-xs font-medium text-fg"
                  >
                    <Undo2 className="size-3.5" />
                    Leave room
                  </button>
                ) : null}
              </div>
            ) : null}
            <StalkPlot node={node} />
            {families?.length ? <FamilyBars nodeSection={node.section} families={families} /> : null}
            <p className="mt-2 text-[12px] leading-relaxed text-fg-muted">{node.summary}</p>
            {node.pooledFrom?.length ? (
              <p className="mt-2 text-[11px] text-fg-muted">
                Pools {node.pooledFrom.length} interior stalks
                {enterable ? " — enter the room to unfold them." : "."}
              </p>
            ) : null}
            {node.arxiv ? (
              <p className="mt-2 font-mono text-[11px] text-fg-subtle">arXiv:{node.arxiv}</p>
            ) : null}
            {node.sources.length ? (
              <p className="mt-1 truncate text-[11px] text-fg-subtle" title={node.sources.join(" · ")}>
                {node.sources[0]?.replace("https://github.com/", "")}
              </p>
            ) : null}

            <h3 className="mt-4 text-[10px] uppercase tracking-wider text-fg-subtle">
              Neighbours & residuals
            </h3>
            <ul className="mt-2 space-y-1">
              {nbrs.map(({ e, other }) => {
                const t = vis.tOf(e.residual);
                const terracotta = e.restrictKind === "type-aware";
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
                        {e.relation} · {RESTRICT_LABEL[e.restrictKind]}
                        {terracotta ? " · gluing failure" : ""} · dim {e.edgeDim}
                      </p>
                      {e.note ? (
                        <p className="mt-0.5 text-[10px] leading-snug text-fg-muted">{e.note}</p>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
            {residualMeaning ? (
              <p className="mt-3 text-[11px] leading-relaxed text-fg-subtle">{residualMeaning}</p>
            ) : null}
          </>
        ) : (
          <>
            {roomPath.length ? (
              <button
                type="button"
                onClick={leaveRoom}
                className="mb-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-bg-soft text-xs font-medium text-fg"
              >
                <Undo2 className="size-3.5" />
                Leave room
              </button>
            ) : null}
            {roomPath.length ? (
              <LayerRoster
                nodes={nodes}
                levels={levels}
                maxLevel={maxLevel}
                onPick={(id) => flyTo(id)}
              />
            ) : (
              <ReviewLedger
                dataset={dataset}
                title={latticeTitle}
                kicker={latticeKicker}
                residualMeaning={residualMeaning}
                nodes={nodes}
                edges={edges}
                rooms={rooms}
                sheafEval={sheafEval}
                onFly={flyTo}
                onEnter={enterRoom}
              />
            )}
            <ProofBlock proof={proof} energy={energy} dataset={dataset} sheafEval={sheafEval} />
          </>
        )}
      </div>
    </aside>
  );
}

function FamilyBars({
  nodeSection,
  families,
}: {
  nodeSection: number[];
  families: { id: string; label: string }[];
}) {
  const max = Math.max(...nodeSection, 0.001);
  return (
    <div className="mt-3">
      <h3 className="text-[10px] uppercase tracking-wider text-fg-subtle">Family coordinates</h3>
      <ul className="mt-1.5 space-y-1">
        {families.slice(0, nodeSection.length).map((f, i) => {
          const v = nodeSection[i] ?? 0;
          return (
            <li key={f.id} className="flex items-center gap-2">
              <span className="w-16 shrink-0 truncate text-[10px] text-fg-muted">{f.label}</span>
              <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-bg-soft">
                <div
                  className="h-full rounded-full bg-l0"
                  style={{ width: `${Math.max(2, (v / max) * 100)}%`, opacity: 0.35 + 0.65 * (v / max) }}
                />
              </div>
              <span className="w-8 text-right font-mono text-[10px] text-fg-subtle">{v.toFixed(2)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ReviewLedger({
  dataset,
  title,
  kicker,
  residualMeaning,
  nodes,
  edges,
  rooms,
  sheafEval,
  onFly,
  onEnter,
}: {
  dataset: string;
  title: string;
  kicker: string;
  residualMeaning?: string;
  nodes: ReturnType<typeof useSheaf.getState>["nodes"];
  edges: ReturnType<typeof useSheaf.getState>["edges"];
  rooms: ReturnType<typeof useSheaf.getState>["rooms"];
  sheafEval: ReturnType<typeof useSheaf.getState>["eval"];
  onFly: (id: string) => void;
  onEnter: (id: string) => void;
}) {
  const sheet = reviewSheet({
    id: dataset,
    title,
    kicker,
    residualMeaning,
    nodes,
    edges,
    rooms,
    eval: sheafEval,
  });
  const sheetMode = sheet.terracotta.length > 0 || sheet.rooms.length > 0;
  if (!sheetMode) {
    return (
      <LayerRoster nodes={nodes} levels={useSheaf.getState().levels} maxLevel={99} onPick={onFly} />
    );
  }
  return (
    <div data-testid="review-ledger" className="mb-4">
      <p className="text-[11px] leading-relaxed text-fg-muted">
        {sheet.stalks} stalks · {sheet.restrictions} restrictions
        {sheet.rooms.length ? ` · ${sheet.rooms.length} interiors` : ""}
        {sheet.files ? ` · ${sheet.files} files scored` : ""}. Working set, not an AST.
      </p>

      {sheet.waist.length ? (
        <>
          <h3 className="mt-3 text-[10px] uppercase tracking-wider text-fg-subtle">L0 waist</h3>
          <ul className="mt-1 flex flex-wrap gap-1">
            {sheet.waist.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onFly(p.id)}
                  className="rounded-md bg-bg-soft px-1.5 py-0.5 text-left text-[11px] text-fg hover:bg-fg hover:text-bg"
                >
                  {p.title}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {sheet.terracotta.length ? (
        <>
          <h3 className="mt-3 text-[10px] uppercase tracking-wider text-fg-subtle">
            Terracotta claims
          </h3>
          <ul className="mt-1 space-y-1">
            {sheet.terracotta.map((c) => (
              <li key={`${c.source}->${c.target}`}>
                <button
                  type="button"
                  data-testid="review-claim"
                  onClick={() => onFly(c.source)}
                  className="w-full rounded-lg px-1.5 py-1.5 text-left hover:bg-bg-soft"
                >
                  <p className="truncate text-[12px] font-medium">
                    {c.sourceTitle}
                    <span className="mx-1 text-fg-subtle">→</span>
                    {c.targetTitle}
                  </p>
                  {c.note ? (
                    <p className="mt-0.5 text-[10px] leading-snug text-fg-muted">{c.note}</p>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {sheet.rooms.length ? (
        <>
          <h3 className="mt-3 text-[10px] uppercase tracking-wider text-fg-subtle">Rooms</h3>
          <ul className="mt-1 space-y-1">
            {sheet.rooms.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  data-testid="review-room"
                  onClick={() => onEnter(r.id)}
                  className="flex w-full items-center justify-between gap-2 rounded-lg px-1.5 py-1.5 text-left hover:bg-bg-soft"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] font-medium">{r.title}</span>
                    {r.kicker ? (
                      <span className="block truncate text-[10px] text-fg-subtle">{r.kicker}</span>
                    ) : null}
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-fg-subtle">
                    {r.nodes} · enter
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

function LayerRoster({
  nodes,
  levels,
  maxLevel,
  onPick,
}: {
  nodes: ReturnType<typeof useSheaf.getState>["nodes"];
  levels: ReturnType<typeof useSheaf.getState>["levels"];
  maxLevel: number;
  onPick: (id: string) => void;
}) {
  return (
    <div className="mb-4">
      <h3 className="text-[10px] uppercase tracking-wider text-fg-subtle">Nodes by layer</h3>
      {levels
        .filter((lv) => lv.id <= maxLevel)
        .map((lv) => {
          const group = nodes.filter((n) => n.level === lv.id);
          return (
            <div key={lv.id} className="mt-2">
              <p className="text-[11px] font-medium text-fg">
                L{lv.id} {lv.label}
                <span className="ml-1 font-mono text-[10px] text-fg-subtle">{group.length}</span>
              </p>
              <ul className="mt-1 flex flex-wrap gap-1">
                {group.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => onPick(n.id)}
                      className="rounded-md bg-bg-soft px-1.5 py-0.5 text-left text-[11px] text-fg hover:bg-fg hover:text-bg"
                      title={n.summary}
                    >
                      {n.title.replace(/^langchain-/, "").replace(/^langchain\//, "")}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
    </div>
  );
}

function ProofBlock({
  proof,
  energy,
  dataset,
  sheafEval,
}: {
  proof: ReturnType<typeof useSheaf.getState>["proof"];
  energy: number;
  dataset: string;
  sheafEval: ReturnType<typeof useSheaf.getState>["eval"];
}) {
  const h = sheafEval?.holdout;
  const c = sheafEval?.cohomo;
  const seg = sheafEval?.segments;
  const hermes = dataset === "hermes-agent";
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
          : hermes
            ? "Hermes digest: restriction residuals against the pinned waist. Terracotta is a named gluing failure, not a missing import."
            : sheafEval
              ? "Rich index: package ⊂ module ⊂ API. Diffuse is harmonic extension on free stalks."
              : "Literature lattice with variable-dimension stalks. Diffuse descends the sheaf Laplacian; Coarsen pools it."}
      </p>
      {hermes && sheafEval?.files ? (
        <p className="mt-3 text-[11px] text-fg-muted">
          Evidence {sheafEval.files} files · working set {seg?.nodes ?? "–"} stalks · {seg?.edges ?? "–"} restrictions.
          Double-click a double-ring stalk to unfold its interior.
        </p>
      ) : null}
      {seg?.package != null ? (
        <p className="mt-3 text-[11px] text-fg-muted">
          Index {seg.package} packages · {seg.module} modules · {seg.api} API clusters · lattice {seg.viz}
        </p>
      ) : null}
      {sheafEval?.honestGaps?.length ? (
        <ul className="mt-3 space-y-1 text-[11px] leading-snug text-fg-subtle">
          {sheafEval.honestGaps.map((g) => (
            <li key={g}>· {g}</li>
          ))}
        </ul>
      ) : null}
      {c ? (
        <dl className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
          <Stat label="dim H⁰" value={String(c.h0)} />
          <Stat label="dim H¹" value={String(c.h1)} />
          <Stat label="χ" value={String(c.chi)} />
          <Stat label="radius" value={c.radius.toFixed(3)} />
        </dl>
      ) : null}
      {h ? (
        <>
          <h3 className="mt-4 text-[10px] uppercase tracking-wider text-fg-subtle">
            Hold-out cosine (n={h.n})
          </h3>
          <dl className="mt-2 grid grid-cols-3 gap-2 text-[12px]">
            <Stat label="Sheaf" value={h.sheafCos.toFixed(3)} />
            <Stat label="Graph L" value={h.graphCos.toFixed(3)} />
            <Stat label="Neighbours" value={h.neighborCos.toFixed(3)} />
          </dl>
        </>
      ) : null}
      {proof ? (
        <dl className="mt-4 grid grid-cols-2 gap-2 text-[12px]">
          <Stat label="Before" value={proof.energyBefore.toFixed(3)} />
          <Stat label="After" value={proof.energyAfter.toFixed(3)} />
          <Stat label="Iters" value={String(proof.iters)} />
          <Stat label="Boundary drift" value={proof.boundaryDrift.toExponential(1)} />
        </dl>
      ) : (
        <p className="mt-4 text-[12px] text-fg-muted">
          {hermes
            ? "Run Diffuse to watch free stalks settle onto the eight pinned L0 pins."
            : "Run Diffuse to watch energy fall and free stalks settle onto the pinned LCEL boundary."}
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
