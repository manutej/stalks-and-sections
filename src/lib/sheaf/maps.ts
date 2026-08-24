import type { RestrictionKind } from "./types";
import {
  embedder,
  identity,
  projector,
  spectralMap,
  typeAwareMap,
} from "./linear";
import { hashSeed, mulberry32 } from "./rng";

export function edgeDimFor(
  kind: RestrictionKind,
  srcDim: number,
  tgtDim: number,
): number {
  switch (kind) {
    case "identity":
      return Math.min(srcDim, tgtDim);
    case "projection":
      return Math.max(2, Math.min(srcDim, tgtDim, 6));
    case "embed":
      return Math.max(srcDim, tgtDim);
    case "spectral":
      return Math.max(2, Math.min(srcDim, tgtDim));
    case "type-aware":
      return Math.max(2, Math.ceil((srcDim + tgtDim) / 3));
  }
}

export function makePair(
  kind: RestrictionKind,
  srcDim: number,
  tgtDim: number,
  seed: string,
): { edgeDim: number; Fsrc: number[][]; Ftgt: number[][] } {
  const rng = mulberry32(hashSeed(seed));
  const edgeDim = edgeDimFor(kind, srcDim, tgtDim);
  let Fsrc: number[][];
  let Ftgt: number[][];
  switch (kind) {
    case "identity": {
      Fsrc = projector(edgeDim, srcDim);
      Ftgt = projector(edgeDim, tgtDim);
      break;
    }
    case "projection": {
      Fsrc = projector(edgeDim, srcDim);
      Ftgt = projector(edgeDim, tgtDim);
      break;
    }
    case "embed": {
      Fsrc = embedder(edgeDim, srcDim);
      Ftgt = embedder(edgeDim, tgtDim);
      break;
    }
    case "spectral": {
      Fsrc = spectralMap(edgeDim, srcDim, rng);
      Ftgt = spectralMap(edgeDim, tgtDim, rng);
      break;
    }
    case "type-aware": {
      Fsrc = typeAwareMap(edgeDim, srcDim, rng);
      Ftgt = typeAwareMap(edgeDim, tgtDim, rng);
      break;
    }
    default: {
      Fsrc = identity(edgeDim);
      Ftgt = identity(edgeDim);
    }
  }
  return { edgeDim, Fsrc, Ftgt };
}

export function kindForRelation(rel: string): RestrictionKind {
  switch (rel) {
    case "defines":
    case "defined_in":
    case "generalizes":
    case "extends":
      return "embed";
    case "is_a":
    case "specializes":
    case "part_of":
      return "projection";
    case "uses":
    case "implements":
    case "minimizes":
      return "identity";
    case "proves":
    case "authored":
      return "type-aware";
    default:
      return "spectral";
  }
}
