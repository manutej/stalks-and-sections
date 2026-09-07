import { type ReactNode } from "react";
import * as Popover from "@radix-ui/react-popover";
import { CircleHelp } from "lucide-react";

export const HINTS = {
  dataset: {
    title: "Knowledge graph",
    body: "Switch the sheaf. Hermes is the live digest. Lattice and Cobb are built in. Anything in docs/examples/*.json appears here.",
  },
  lattice: {
    title: "Lattice",
    body: "The literature graph. Each node is a stalk (a vector space of its own dimension) drawn from sheaf papers. Edges are restriction maps between them.",
  },
  cobb: {
    title: "Cobb graph",
    body: "A small seed from Cobb–Gebhart with a known closed-form harmonic extension. Use Exact solve to compare the Euler walk against Theorem 3.1.",
  },
  primer: {
    title: "Primer",
    body: "Short definitions: stalks, restriction maps, coboundary, Dirichlet energy, global sections, Diffuse, and hierarchical pooling.",
  },
  principles: {
    title: "Principles",
    body: "Why residuals are first-class, why stalks have different dimensions, and how the picture follows Bertin: size for quantity, hue for hierarchy.",
  },
  reset: {
    title: "Reset",
    body: "Restore this dataset to its starting sections, layout, and filters. Selection, rooms, and energy history clear.",
  },
  search: {
    title: "Search",
    body: "Filter stalks by name. Enter jumps the camera to the first match and opens it in the inspector.",
  },
  energy: {
    title: "Dirichlet energy",
    body: "Sum of squared restriction residuals. Lower means the assignment is closer to a global section — a consistent fact across the lattice.",
  },
  kernel: {
    title: "dim H⁰",
    body: "Heat-kernel rank heuristic for dim ker L_F — a lower bound, capped at 12 samples. After pinning known stalks, unique means one harmonic extension; family means Diffuse picks one of many. χ = vDim − eDim is the cochain count, not a claim that H⁰ equals χ.",
  },
  views: {
    title: "Views",
    body: "Strata is the 3D hierarchy. Matrix is the Bertin residual adjacency. ×4 is one 2D slice per plane. Spectral places stalks by the residual-weighted 1-skeleton Fiedler embedding — not the full block L_F. Keys 1–4.",
  },
  strata: {
    title: "Strata",
    body: "Default 3D lattice. Planes are hierarchy. Force layout keeps layers readable. Residuals colour the restrictions.",
  },
  matrix: {
    title: "Restriction matrix",
    body: "2D review. Rows and columns are stalks, seriated by residual-weighted Fiedler order, grouped by layer. Colour is residual. This is the screenshot a paper can quote.",
  },
  multiples: {
    title: "Small multiples",
    body: "One 2D drawing per visible plane, same xz as the force layout, linked selection. Compare layers without orbiting.",
  },
  spectral: {
    title: "Spectral layout",
    body: "xz from the two smallest non-constant eigenvectors of the residual-weighted graph Laplacian L = D − W, W_e = 1/(0.2 + residual). y stays hierarchy. Disagreement with Strata is the sheaf talking.",
  },
  restrictKind: {
    title: "Restriction kind",
    body: "Second visual variable. Solid = identity. Dashed = projection. Dotted = embed. Midpoint octahedron = type-aware (terracotta gluing failure). Colour is still residual.",
  },
  depth: {
    title: "Layers",
    body: "How many hierarchy planes to show. L0 waist sits at the bottom. Drag left to peel the stack. This is the visible working set, not a hard cap.",
  },
  scale: {
    title: "Node size",
    body: "Visual scale of every stalk. True encoding is still dimension — this only helps you read a dense lattice.",
  },
  consistency: {
    title: "Edge glow",
    body: "Brightens restriction lines. Does not change the math; it is a reading aid so consistent (teal) and noisy (terracotta) edges separate.",
  },
  cut: {
    title: "Noise cut",
    body: "Threshold used by Hide noise. Edges whose residual sits above this cut are treated as obstruction, not signal.",
  },
  filter: {
    title: "Hide noise",
    body: "Drop high-residual restrictions so only near-sections remain. Pair with Noise cut. Trusted knowledge is what survives.",
  },
  diffuse: {
    title: "Diffuse",
    body: "Sheaf-Laplacian smoothing. Known (ringed) stalks stay put; unknown stalks slide toward a consistent assignment. Energy should fall.",
  },
  exact: {
    title: "Exact solve",
    body: "Closed form for the Cobb graph (Theorem 3.1). Compares the iterative Diffuse walk against the unique harmonic extension.",
  },
  pool: {
    title: "Coarsen",
    body: "Hierarchical pooling: neighbouring interiors collapse into supernodes. Harmonic (low-frequency) structure is kept. Toggle again to restore.",
  },
  labels: {
    title: "Names",
    body: "Paper-chip names for the topmost visible layer plus L0 pins. Peel Layers to read the plane below. Hover names any stalk. Names off hides the chips.",
  },
  close: {
    title: "Leave a stalk",
    body: "Close returns to the lattice. You can also press Esc, click the same node again, or click an empty layer plane.",
  },
  review: {
    title: "Review ledger",
    body: "The 2D companion to the lattice: pinned waist, terracotta gluing failures, and enterable rooms. This is the working set. It is not a file tree.",
  },
  room: {
    title: "Enter room",
    body: "A stalk with a double ring is a door. Double-click it, or press Enter room, to unfold its interior sheaf — spaces inside spaces. Esc leaves the room. This is how 3387 files stay navigable without an AST dump.",
  },
} as const;

export function Hint({
  k,
  side = "top",
}: {
  k: keyof typeof HINTS;
  side?: "top" | "bottom" | "left" | "right";
}) {
  const h = HINTS[k];
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-fg-subtle hover:bg-bg-soft hover:text-fg"
          aria-label={`About ${h.title}`}
        >
          <CircleHelp className="size-3.5" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content side={side} sideOffset={8} collisionPadding={12} className="sheaf-hint">
          <p className="text-xs font-medium text-fg">{h.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-fg-muted">{h.body}</p>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function Explained({
  k,
  side = "top",
  children,
}: {
  k: keyof typeof HINTS;
  side?: "top" | "bottom" | "left" | "right";
  children: ReactNode;
}) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {children}
      <span className="hidden sm:inline-flex">
        <Hint k={k} side={side} />
      </span>
    </div>
  );
}
