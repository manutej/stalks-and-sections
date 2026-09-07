import { create } from "zustand";
import {
  buildRoom,
  closedFormTransE,
  diffuse,
  hierarchicalPool,
  layoutForce,
  loadGraph,
  unfoldMembers,
} from "@/lib/sheaf";
import { dirichletEnergy } from "@/lib/sheaf/energy";
import type {
  DatasetId,
  FamilyDef,
  LevelDef,
  ProofReport,
  SheafEdge,
  SheafEval,
  SheafGraph,
  SheafNode,
  Vec3,
} from "@/lib/sheaf/types";

const INTRO_KEY = "stalks-intro-v1";

type SpaceSnap = {
  title: string;
  kicker: string;
  blurb: string;
  nodes: SheafNode[];
  edges: SheafEdge[];
  levels: LevelDef[];
  positions: Record<string, Vec3>;
  baseNodes: SheafNode[];
  baseEdges: SheafEdge[];
  basePositions: Record<string, Vec3>;
  energy: number;
  maxLevel: number;
  pooled: boolean;
  selectedId: string | null;
  eval: SheafEval | undefined;
};

function queryDataset(): DatasetId | null {
  if (typeof window === "undefined") return null;
  try {
    const g = new URLSearchParams(window.location.search).get("g");
    return g && /^[a-z0-9][a-z0-9._-]*$/i.test(g) ? g : null;
  } catch {
    return null;
  }
}

function snapshot(id: DatasetId) {
  const g = loadGraph(id);
  const positions = layoutForce(g.nodes, g.edges);
  const top = Math.max(0, ...g.levels.map((l) => l.id));
  return {
    dataset: g.id,
    nodes: g.nodes,
    edges: g.edges,
    levels: g.levels,
    title: g.title,
    kicker: g.kicker,
    blurb: g.blurb,
    residualMeaning: g.residualMeaning,
    families: g.families,
    rooms: g.rooms,
    positions,
    energy: dirichletEnergy(g.nodes, g.edges),
    eval: g.eval,
    maxLevel: top,
  };
}

const boot = snapshot(queryDataset() ?? "hermes-agent");

interface SheafStore {
  dataset: DatasetId;
  title: string;
  kicker: string;
  blurb: string;
  residualMeaning?: string;
  families?: FamilyDef[];
  rooms?: Record<string, SheafGraph>;
  nodes: SheafNode[];
  edges: SheafEdge[];
  levels: LevelDef[];
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
  roomStack: SpaceSnap[];
  roomPath: { id: string; title: string }[];
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
  enterRoom: (id: string) => void;
  leaveRoom: () => void;
  leaveToRoot: () => void;
  reset: () => void;
  setPrimer: (v: boolean) => void;
  setPrinciples: (v: boolean) => void;
  setHelp: (v: boolean) => void;
  dismissIntro: () => void;
  setMobilePanel: (p: SheafStore["mobilePanel"]) => void;
  closeOverlays: () => void;
}

function applyGraph(
  room: SheafGraph,
  extra: Partial<SheafStore> = {},
): Partial<SheafStore> {
  const positions = layoutForce(room.nodes, room.edges);
  const top = Math.max(0, ...room.levels.map((l) => l.id), 0);
  const energy = dirichletEnergy(room.nodes, room.edges);
  return {
    title: room.title,
    kicker: room.kicker,
    blurb: room.blurb,
    nodes: room.nodes,
    edges: room.edges,
    levels: room.levels,
    positions,
    baseNodes: room.nodes.map((n) => ({ ...n, section: n.section.slice() })),
    baseEdges: room.edges,
    basePositions: positions,
    energy,
    energyLog: [energy],
    eval: room.eval,
    proof: null,
    pooled: false,
    maxLevel: top,
    selectedId: extra.selectedId ?? null,
    flyToId: extra.flyToId ?? extra.selectedId ?? null,
    mobilePanel: extra.selectedId ? "inspect" : "none",
    ...extra,
  };
}

export const useSheaf = create<SheafStore>((set, get) => ({
  dataset: boot.dataset,
  title: boot.title,
  kicker: boot.kicker,
  blurb: boot.blurb,
  residualMeaning: boot.residualMeaning,
  families: boot.families,
  rooms: boot.rooms,
  nodes: boot.nodes,
  edges: boot.edges,
  levels: boot.levels,
  positions: boot.positions,
  baseNodes: boot.nodes.map((n) => ({ ...n, section: n.section.slice() })),
  baseEdges: boot.edges,
  basePositions: boot.positions,
  selectedId: null,
  hoveredId: null,
  maxLevel: boot.maxLevel,
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
  introOpen: boot.dataset === "hermes-agent" || Boolean(queryDataset()) ? false : true,
  mobilePanel: "none",
  roomStack: [],
  roomPath: [],

  hydrate: () => {
    const q = queryDataset();
    let introOpen = get().introOpen;
    try {
      if (localStorage.getItem(INTRO_KEY) === "1") introOpen = false;
    } catch {
      /* ignore */
    }
    if (q) introOpen = false;
    if (q && q !== get().dataset) {
      get().setDataset(q);
    }
    set({ introOpen });
  },

  setDataset: (id) => {
    const snap = snapshot(id);
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
      mobilePanel: "none",
      roomStack: [],
      roomPath: [],
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

  enterRoom: (id) => {
    const s = get();
    const current = s.nodes.find((n) => n.id === id);
    if (!current) return;
    let room: SheafGraph | null = null;
    if (current.pooledFrom?.length && !s.baseNodes.some((n) => n.id === id)) {
      room = unfoldMembers(current, s.baseNodes, s.baseEdges);
    } else {
      const srcN = s.pooled ? s.baseNodes : s.nodes;
      const srcE = s.pooled ? s.baseEdges : s.edges;
      room = buildRoom(id, srcN, srcE, s.rooms);
    }
    if (!room || room.nodes.length < 3) return;
    const snap: SpaceSnap = {
      title: s.title,
      kicker: s.kicker,
      blurb: s.blurb,
      nodes: s.nodes,
      edges: s.edges,
      levels: s.levels,
      positions: s.positions,
      baseNodes: s.baseNodes,
      baseEdges: s.baseEdges,
      basePositions: s.basePositions,
      energy: s.energy,
      maxLevel: s.maxLevel,
      pooled: s.pooled,
      selectedId: s.selectedId,
      eval: s.eval,
    };
    const pin = room.nodes.find((n) => n.id === id)?.id ?? room.nodes[0]!.id;
    set({
      ...applyGraph(room, { selectedId: pin, flyToId: pin }),
      roomStack: [...s.roomStack, snap],
      roomPath: [...s.roomPath, { id, title: current.title }],
    });
  },

  leaveRoom: () => {
    const { roomStack, roomPath } = get();
    const snap = roomStack[roomStack.length - 1];
    if (!snap) return;
    const left = roomPath[roomPath.length - 1];
    set({
      title: snap.title,
      kicker: snap.kicker,
      blurb: snap.blurb,
      nodes: snap.nodes,
      edges: snap.edges,
      levels: snap.levels,
      positions: snap.positions,
      baseNodes: snap.baseNodes,
      baseEdges: snap.baseEdges,
      basePositions: snap.basePositions,
      energy: snap.energy,
      energyLog: [snap.energy],
      eval: snap.eval,
      maxLevel: snap.maxLevel,
      pooled: snap.pooled,
      proof: null,
      selectedId: left?.id ?? snap.selectedId,
      flyToId: left?.id ?? null,
      mobilePanel: left?.id ? "inspect" : "none",
      roomStack: roomStack.slice(0, -1),
      roomPath: roomPath.slice(0, -1),
    });
  },

  leaveToRoot: () => {
    const { roomStack } = get();
    const snap = roomStack[0];
    if (!snap) return;
    set({
      title: snap.title,
      kicker: snap.kicker,
      blurb: snap.blurb,
      nodes: snap.nodes,
      edges: snap.edges,
      levels: snap.levels,
      positions: snap.positions,
      baseNodes: snap.baseNodes,
      baseEdges: snap.baseEdges,
      basePositions: snap.basePositions,
      energy: snap.energy,
      energyLog: [snap.energy],
      eval: snap.eval,
      maxLevel: snap.maxLevel,
      pooled: snap.pooled,
      proof: null,
      selectedId: null,
      flyToId: null,
      mobilePanel: "none",
      roomStack: [],
      roomPath: [],
    });
  },

  reset: () => {
    const { dataset } = get();
    const snap = snapshot(dataset);
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
      stalkScale: 1,
      consistency: 0.55,
      mobilePanel: "none",
      roomStack: [],
      roomPath: [],
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
  closeOverlays: () => {
    const { selectedId, roomStack } = get();
    if (selectedId) {
      set({ selectedId: null, mobilePanel: "none" });
      return;
    }
    if (roomStack.length) {
      get().leaveRoom();
      return;
    }
    set({
      selectedId: null,
      mobilePanel: "none",
      primerOpen: false,
      principlesOpen: false,
      helpOpen: false,
    });
  },
}));
