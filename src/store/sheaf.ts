import { create } from "zustand";
import {
  closedFormTransE,
  DATASETS,
  diffuse,
  hierarchicalPool,
  layoutForce,
  loadGraph,
} from "@/lib/sheaf";
import { dirichletEnergy } from "@/lib/sheaf/energy";
import type {
  DatasetId,
  ProofReport,
  SheafEdge,
  SheafEval,
  SheafNode,
  Vec3,
} from "@/lib/sheaf/types";

const INTRO_KEY = "stalks-intro-v1";

function queryDataset(): DatasetId | null {
  try {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("g") ?? params.get("dataset") ?? params.get("graph");
    if (!raw) return null;
    return DATASETS.some((d) => d.id === raw) ? raw : null;
  } catch {
    return null;
  }
}

function writeQuery(id: DatasetId) {
  try {
    if (typeof window === "undefined" || typeof history === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.delete("dataset");
    url.searchParams.delete("graph");
    url.searchParams.set("g", id);
    history.replaceState(history.state, "", `${url.pathname}${url.search}${url.hash}`);
  } catch {
    /* ignore */
  }
}

function snapshot(id: DatasetId) {
  const g = loadGraph(id);
  const positions = layoutForce(g.nodes, g.edges);
  return {
    nodes: g.nodes,
    edges: g.edges,
    levels: g.levels,
    title: g.title,
    kicker: g.kicker,
    blurb: g.blurb,
    positions,
    energy: dirichletEnergy(g.nodes, g.edges),
    eval: g.eval,
  };
}

const boot = snapshot("langchainjs-rich");

interface SheafStore {
  dataset: DatasetId;
  title: string;
  kicker: string;
  blurb: string;
  nodes: SheafNode[];
  edges: SheafEdge[];
  levels: ReturnType<typeof loadGraph>["levels"];
  positions: Record<string, Vec3>;
  baseNodes: SheafNode[];
  baseEdges: SheafEdge[];
  basePositions: Record<string, Vec3>;
  selectedId: string | null;
  hoveredId: string | null;
  maxLevel: number;
  stalkScale: number;
  consistency: number;
  filterNoise: boolean;
  noiseCut: number;
  pooled: boolean;
  showLabels: boolean;
  energy: number;
  energyLog: number[];
  eval: SheafEval | undefined;
  proof: ProofReport | null;
  flyToId: string | null;
  search: string;
  primerOpen: boolean;
  principlesOpen: boolean;
  helpOpen: boolean;
  introOpen: boolean;
  mobilePanel: "none" | "inspect" | "controls";
  hydrate: () => void;
  setDataset: (id: DatasetId) => void;
  select: (id: string | null) => void;
  hover: (id: string | null) => void;
  setMaxLevel: (n: number) => void;
  setStalkScale: (n: number) => void;
  setConsistency: (n: number) => void;
  setFilterNoise: (v: boolean) => void;
  setNoiseCut: (n: number) => void;
  setShowLabels: (v: boolean) => void;
  setSearch: (q: string) => void;
  flyTo: (id: string | null) => void;
  diffuseNow: () => void;
  exactNow: () => void;
  poolNow: () => void;
  reset: () => void;
  setPrimer: (v: boolean) => void;
  setPrinciples: (v: boolean) => void;
  setHelp: (v: boolean) => void;
  dismissIntro: () => void;
  setMobilePanel: (p: SheafStore["mobilePanel"]) => void;
  closeOverlays: () => void;
}

export const useSheaf = create<SheafStore>((set, get) => ({
  dataset: "langchainjs-rich",
  title: boot.title,
  kicker: boot.kicker,
  blurb: boot.blurb,
  nodes: boot.nodes,
  edges: boot.edges,
  levels: boot.levels,
  positions: boot.positions,
  baseNodes: boot.nodes.map((n) => ({ ...n, section: n.section.slice() })),
  baseEdges: boot.edges,
  basePositions: boot.positions,
  selectedId: null,
  hoveredId: null,
  maxLevel: 3,
  stalkScale: 1,
  consistency: 0.55,
  filterNoise: false,
  noiseCut: 0.72,
  pooled: false,
  showLabels: true,
  energy: boot.energy,
  energyLog: [boot.energy],
  eval: boot.eval,
  proof: null,
  flyToId: null,
  search: "",
  primerOpen: false,
  principlesOpen: false,
  helpOpen: false,
  introOpen: true,
  mobilePanel: "none",

  hydrate: () => {
    const id = queryDataset();
    if (id) {
      if (get().dataset !== id) get().setDataset(id);
      else writeQuery(id);
      set({ introOpen: false });
      return;
    }
    try {
      if (localStorage.getItem(INTRO_KEY) === "1") set({ introOpen: false });
    } catch {
      /* ignore */
    }
  },

  setDataset: (id) => {
    const snap = snapshot(id);
    const top = Math.max(0, ...snap.levels.map((l) => l.id));
    writeQuery(id);
    set({
      dataset: id,
      ...snap,
      baseNodes: snap.nodes.map((n) => ({ ...n, section: n.section.slice() })),
      baseEdges: snap.edges,
      basePositions: snap.positions,
      selectedId: null,
      pooled: false,
      proof: null,
      energyLog: [snap.energy],
      flyToId: null,
      mobilePanel: "none",
      maxLevel: top,
    });
  },

  select: (id) => {
    const cur = get().selectedId;
    if (id && id === cur) {
      set({ selectedId: null, mobilePanel: "none" });
      return;
    }
    set({
      selectedId: id,
      mobilePanel: id ? "inspect" : "none",
    });
  },

  hover: (id) => set({ hoveredId: id }),
  setMaxLevel: (n) => set({ maxLevel: n }),
  setStalkScale: (n) => set({ stalkScale: n }),
  setConsistency: (n) => set({ consistency: n }),
  setFilterNoise: (v) => set({ filterNoise: v }),
  setNoiseCut: (n) => set({ noiseCut: n }),
  setShowLabels: (v) => set({ showLabels: v }),
  setSearch: (q) => set({ search: q }),
  flyTo: (id) =>
    set({
      flyToId: id,
      selectedId: id ?? get().selectedId,
      mobilePanel: id ? "inspect" : get().mobilePanel,
    }),

  diffuseNow: () => {
    const { nodes, edges } = get();
    const result = diffuse(nodes, edges, { maxIters: 90, h: 0.85 });
    set({
      nodes: result.nodes,
      edges: result.edges,
      energy: result.report.energyAfter,
      energyLog: result.energyLog,
      proof: result.report,
      pooled: false,
    });
  },

  exactNow: () => {
    const { nodes, edges, dataset } = get();
    if (dataset !== "cobb") {
      get().diffuseNow();
      return;
    }
    const before = dirichletEnergy(nodes, edges);
    const iter = diffuse(nodes, edges, { maxIters: 400, h: 1, tol: 1e-10 });
    const sol = closedFormTransE(nodes, edges);
    const after = dirichletEnergy(sol.nodes, sol.edges);
    let diff = 0;
    for (const n of sol.nodes) {
      const a = iter.nodes.find((x) => x.id === n.id);
      if (!a) continue;
      for (let i = 0; i < n.section.length; i++) {
        diff = Math.max(diff, Math.abs(n.section[i]! - a.section[i]!));
      }
    }
    set({
      nodes: sol.nodes,
      edges: sol.edges,
      energy: after,
      energyLog: iter.energyLog,
      proof: {
        energyBefore: before,
        energyAfter: after,
        iters: iter.report.iters,
        boundaryDrift: iter.report.boundaryDrift,
        energyIncreases: iter.report.energyIncreases,
        closedFormDiff: diff,
        unique: sol.unique,
        note: "Euler vs Theorem 3.1 closed form. max |x_iter − x★| reported as closedFormDiff.",
      },
    });
  },

  poolNow: () => {
    const { nodes, edges, pooled, baseNodes, baseEdges, basePositions } = get();
    if (pooled) {
      set({
        nodes: baseNodes.map((n) => ({ ...n, section: n.section.slice() })),
        edges: baseEdges,
        positions: basePositions,
        pooled: false,
        energy: dirichletEnergy(baseNodes, baseEdges),
      });
      return;
    }
    const pooledG = hierarchicalPool(nodes, edges);
    const positions = layoutForce(pooledG.nodes, pooledG.edges, 160);
    set({
      nodes: pooledG.nodes,
      edges: pooledG.edges,
      positions,
      pooled: true,
      energy: dirichletEnergy(pooledG.nodes, pooledG.edges),
      selectedId: null,
      mobilePanel: "none",
    });
  },

  reset: () => {
    const { dataset } = get();
    const snap = snapshot(dataset);
    const top = Math.max(0, ...snap.levels.map((l) => l.id));
    set({
      ...snap,
      baseNodes: snap.nodes.map((n) => ({ ...n, section: n.section.slice() })),
      baseEdges: snap.edges,
      basePositions: snap.positions,
      selectedId: null,
      pooled: false,
      proof: null,
      energyLog: [snap.energy],
      flyToId: null,
      filterNoise: false,
      maxLevel: top,
      stalkScale: 1,
      consistency: 0.55,
      mobilePanel: "none",
    });
  },

  setPrimer: (v) => set({ primerOpen: v, helpOpen: v ? false : get().helpOpen }),
  setPrinciples: (v) =>
    set({ principlesOpen: v, helpOpen: v ? false : get().helpOpen }),
  setHelp: (v) =>
    set({
      helpOpen: v,
      primerOpen: v ? false : get().primerOpen,
      principlesOpen: v ? false : get().principlesOpen,
    }),
  dismissIntro: () => {
    try {
      localStorage.setItem(INTRO_KEY, "1");
    } catch {
      /* ignore */
    }
    set({ introOpen: false });
  },
  setMobilePanel: (p) => set({ mobilePanel: p }),
  closeOverlays: () =>
    set({
      selectedId: null,
      mobilePanel: "none",
      primerOpen: false,
      principlesOpen: false,
      helpOpen: false,
    }),
}));
