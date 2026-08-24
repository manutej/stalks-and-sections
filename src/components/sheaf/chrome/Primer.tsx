import { X } from "lucide-react";
import { useSheaf } from "@/store/sheaf";

const PRIMER = [
  {
    title: "Stalks",
    body: "Each node owns a vector space F(v) of its own dimension (2–16). Size in the lattice is that dimension. There is no forced common ambient space.",
  },
  {
    title: "Restriction maps",
    body: "An edge is a pair of linear maps into a shared edge stalk. Identity, projection, embed, spectral, and type-aware maps are coloured by residual, not by type — type is in the inspector.",
  },
  {
    title: "Coboundary & energy",
    body: "δx = F_s x_s − F_t x_t. Dirichlet energy E = Σ ‖δx‖² is the sheaf Laplacian quadratic form. Lower energy, higher probability of truth.",
  },
  {
    title: "Global sections",
    body: "When δx = 0 on every edge, the assignment is a global section — a consistent fact. Approximate sections are what survive Filter Noise.",
  },
  {
    title: "Diffuse",
    body: "Degree-normalised Euler descent on L_F (Cobb–Gebhart Thm 3.2). Known stalks are frozen; unknowns harmonic-extend. On the Cobb graph, Exact solve is the closed form (Thm 3.1).",
  },
  {
    title: "HiSP pool",
    body: "Hierarchical coarsening: cluster interiors collapse to supernodes whose stalks are projections of the members. Harmonic (low-frequency) structure is conserved.",
  },
];

const PRINCIPLES = [
  {
    title: "Integrity via cohomology",
    body: "Residuals of the sheaf Laplacian are first-class visual variables, not decoration. Trusted knowledge is the approximate kernel of L_F.",
  },
  {
    title: "Mathematical novelty",
    body: "Variable-dimension stalks plus typed restrictions are the representation itself. Click Novel multi-dim stalks (dim 16) to see the largest fibre.",
  },
  {
    title: "Complexity reduction",
    body: "Hierarchical pooling, residual filtering, and progressive disclosure (click → stalk) reduce what you must hold in working memory.",
  },
  {
    title: "Bertin-correct encoding",
    body: "Size and value for quantitative residual and dimension. Position and ordered hue for hierarchy. No rainbow, no false-order traps.",
  },
  {
    title: "Exploration over exposition",
    body: "The lattice is the explanation. This primer is on demand. Drag, search, diffuse, pool.",
  },
];

export function PrimerModal() {
  const primerOpen = useSheaf((s) => s.primerOpen);
  const principlesOpen = useSheaf((s) => s.principlesOpen);
  const setPrimer = useSheaf((s) => s.setPrimer);
  const setPrinciples = useSheaf((s) => s.setPrinciples);
  const open = primerOpen || principlesOpen;
  if (!open) return null;
  const items = primerOpen ? PRIMER : PRINCIPLES;
  const title = primerOpen ? "Math primer" : "Core principles";
  const close = () => {
    setPrimer(false);
    setPrinciples(false);
  };
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal
        aria-label={title}
        className="sheaf-panel max-h-[min(80dvh,640px)] w-full max-w-lg overflow-hidden rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="font-display text-xl">{title}</h2>
          <button
            type="button"
            onClick={close}
            className="flex h-10 items-center gap-1.5 rounded-lg bg-fg px-3 text-sm font-medium text-bg"
            aria-label="Close"
          >
            <X className="size-4" />
            Close
          </button>
        </div>
        <div className="sheaf-scroll max-h-[min(64dvh,520px)] space-y-4 overflow-y-auto px-5 py-4">
          {items.map((it) => (
            <section key={it.title}>
              <h3 className="font-medium">{it.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-fg-muted">{it.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
