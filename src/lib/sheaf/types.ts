export type NodeKind =
  | "paper"
  | "concept"
  | "algorithm"
  | "theorem"
  | "model"
  | "integrity";

export type RestrictionKind =
  | "identity"
  | "projection"
  | "embed"
  | "spectral"
  | "type-aware";

export type DatasetId = "literature" | "cobb";

export type LevelId = 0 | 1 | 2 | 3;

export interface LevelDef {
  id: LevelId;
  code: string;
  label: string;
  kicker: string;
  blurb: string;
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

export interface SheafGraph {
  id: DatasetId;
  title: string;
  kicker: string;
  blurb: string;
  levels: LevelDef[];
  nodes: SheafNode[];
  edges: SheafEdge[];
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
