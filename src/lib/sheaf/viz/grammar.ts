/** Visual grammar for Stalks & Sections stills.
 *  One encoding per channel. Do not invent a second colour system.
 *  JSON-agnostic: any sheaf JSON uses these tokens.
 */

export const VIZ_TOKENS = {
  bg: "#081114",
  bgElev: "#10181c",
  bgSoft: "#162026",
  fg: "#e8ece8",
  fgMuted: "#8a9690",
  fgSubtle: "#5c6864",
  paper: "#e8ece8",
  ink: "#081114",
  line: "#2a3438",
  levels: ["#4a9a92", "#6b8ea3", "#8a9a6e", "#b08978"],
  residual: { lo: "#2f8f78", mid: "#c4a574", hi: "#c45c68" },
  fonts: {
    display: 'Fraunces, "Times New Roman", serif',
    sans: '"IBM Plex Sans", "Segoe UI", system-ui, sans-serif',
    mono: '"IBM Plex Mono", ui-monospace, Menlo, monospace',
  },
} as const;

export const VIZ_ENCODINGS = [
  { channel: "size", maps: "stalk dimension", rule: "Node radius scales with dim F(v). Not importance." },
  { channel: "hue", maps: "hierarchy level", rule: "Ordered teal L0 → terracotta L3. No rainbow." },
  { channel: "edge colour", maps: "restriction residual", rule: "Diverging teal (glues) → terracotta (fails)." },
  { channel: "dash", maps: "restriction kind", rule: "Solid identity; dashed projection; dotted embed." },
  { channel: "diamond", maps: "type-aware claim", rule: "Midpoint octahedron on terracotta gluing failures." },
  { channel: "ring", maps: "pinned / known", rule: "Round ring = Diffuse may not move this stalk." },
  { channel: "hex ring", maps: "enterable room", rule: "Double-click / Enter unfolds the interior sheaf." },
] as const;

export const VIZ_VIEWS = [
  { id: "lattice", label: "Lattice", key: "L", job: "Hasse 1-skeleton. The still of stalks and restrictions." },
  { id: "strata", label: "Strata", key: "1", job: "Hierarchy as stacked planes. Default discovery view." },
  { id: "matrix", label: "Matrix", key: "2", job: "Bertin residual adjacency. The 2D review." },
  { id: "multiples", label: "×4", key: "3", job: "One 2D slice per plane, linked selection." },
  { id: "spectral", label: "Spectral", key: "4", job: "xz from residual-weighted 1-skeleton Fiedler. y stays level." },
] as const;

/** How the lattice still is laid out. Same rules for every sheaf JSON. */
export const VIZ_LATTICE = {
  id: "lattice",
  file: "lattice.svg",
  y: "level — L0 foundations at the bottom, higher cells above",
  x: "stable order within a level (by id)",
  node: {
    size: "dim F(v)",
    hue: "level",
    ring: "known / pinned",
    hex: "enterable room",
  },
  edge: {
    colour: "residual (kind-proxy if missing)",
    dash: "restrictKind",
    diamond: "type-aware only",
  },
  kindDash: {
    identity: "",
    projection: "6 5",
    embed: "2 5",
    spectral: "10 4",
    "type-aware": "",
  },
  kindProxy: {
    identity: 0.12,
    projection: 0.4,
    embed: 0.28,
    spectral: 0.55,
    "type-aware": 0.92,
  },
  capPerLevel: 12,
} as const;

export const VIZ_DO_NOT = [
  "Do not use a rainbow or a second residual colour scale.",
  "Do not draw one stalk per source file. 113 is the working set, not 3387.",
  "Do not flatten every fibre into one ambient dimension.",
  "Do not caption Spectral as the full sheaf Laplacian L_F — it is the 1-skeleton.",
  "Do not quote hold-out as a win. Kind-tagged maps lose to the identity graph (0.732 vs 0.851).",
  "Do not fork the lattice layout per dataset. y is level; size is dim; hue is level.",
] as const;
