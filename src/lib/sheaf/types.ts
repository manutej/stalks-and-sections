export type NodeKind = string;

export type RestrictionKind =
  | "identity"
  | "projection"
  | "embed"
  | "spectral"
  | "type-aware";

export type DatasetId = string;

export type LevelId = number;

export interface LevelDef {
  id: LevelId;
  code: string;
  label: string;
  kicker: string;
  blurb: string;
}

export interface DatasetMeta {
  id: DatasetId;
  label: string;
  hint: "lattice" | "cobb" | "dataset";
  builtin: boolean;
}

export interface SheafNode {
  id: string;
  title: string;
  kind: NodeKind;
  level: LevelId;
  dim: number;
  section: number[];
  known: boolean;
  summary: string;
  sources: string[];
  arxiv?: string;
  aliases?: string[];
  pooledFrom?: string[];
}

export interface SheafEdge {
  id: string;
  source: string;
  target: string;
  relation: string;
  restrictKind: RestrictionKind;
  edgeDim: number;
  Fsrc: number[][];
  Ftgt: number[][];
  translation: number[];
  residual: number;
  note?: string;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface SheafEval {
  files?: number;
  loc?: number;
  dim?: number;
  segments?: {
    package: number;
    module: number;
    api: number;
    viz: number;
    edges: number;
  };
  holdout?: {
    n: number;
    sheafCos: number;
    graphCos: number;
    neighborCos: number;
    sheafFamCos?: number;
    graphFamCos?: number;
    sheafMse: number;
    graphMse: number;
  };
  cohomo?: {
    h0: number;
    h1: number;
    chi: number;
    energy: number;
    radius: number;
  };
  impact?: { seed: string | null; ranked: { id: string; mag: number }[] };
}

export interface SheafGraph {
  id: DatasetId;
  title: string;
  kicker: string;
  blurb: string;
  residualMeaning?: string;
  levels: LevelDef[];
  nodes: SheafNode[];
  edges: SheafEdge[];
  eval?: SheafEval;
}

export interface ProofReport {
  energyBefore: number;
  energyAfter: number;
  iters: number;
  boundaryDrift: number;
  energyIncreases: number;
  closedFormDiff: number | null;
  unique: boolean | null;
  note: string;
}
