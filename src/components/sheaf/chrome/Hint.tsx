import { type ReactNode } from "react";
import * as Popover from "@radix-ui/react-popover";
import { CircleHelp } from "lucide-react";

export const HINTS = {
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
    body: "Restore this dataset to its starting sections, layout, and filters. Selection and energy history clear.",
  },
  search: {
    title: "Search",
    body: "Filter stalks by name. Enter jumps the camera to the first match and opens it in the inspector.",
  },
  energy: {
    title: "Dirichlet energy",
    body: "Sum of squared restriction residuals. Lower means the assignment is closer to a global section — a consistent fact across the lattice.",
  },
  depth: {
    title: "Layers",
    body: "How many hierarchy planes to show. L0 foundations sit at the bottom; L3 integrity and visualisation sit at the top. Drag left to peel the stack.",
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
    body: "Paper-chip names for the topmost visible layer. Peel Layers to read the plane below. Hover or select any stalk to name it. When a node is open, other names hide.",
  },
  close: {
    title: "Leave a stalk",
    body: "Close returns to the lattice. You can also press Esc, click the same node again, or click an empty layer plane.",
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
