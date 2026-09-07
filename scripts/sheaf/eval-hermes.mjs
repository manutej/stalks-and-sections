#!/usr/bin/env node
/**
 * Adversarial numbers for the Hermes digest.
 * Builds restriction maps the same way the explorer does (makePair from kind),
 * then scores dim H⁰ (heat-kernel, capped), χ = vDim − eDim, and hold-out
 * harmonic extension vs identity-graph Laplacian vs neighbour mean.
 *
 * Isolated from LCEL: reads docs/examples/hermes-agent.json only.
 */
import { readFileSync } from "node:fs";
import {
  estimateH0,
  eulerCharacteristic,
  holdoutTest,
  makePair,
  recomputeResiduals,
} from "./algebra.mjs";

const H0_SAMPLES = 12;
const H0_ITERS = 40;

export function loadHermesNumeric() {
  const raw = JSON.parse(readFileSync("docs/examples/hermes-agent.json", "utf8"));
  const nodes = raw.nodes.map((n) => ({
    id: n.id,
    dim: n.dim,
    section: n.section.slice(),
    known: Boolean(n.known),
    level: n.level,
    title: n.title,
  }));
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const kindCount = { identity: 0, projection: 0, embed: 0, spectral: 0, "type-aware": 0 };
  const edges = raw.edges.map((e) => {
    const s = byId.get(e.source);
    const t = byId.get(e.target);
    const kind = e.restrictKind ?? "spectral";
    kindCount[kind] = (kindCount[kind] ?? 0) + 1;
    const maps = makePair(kind, s?.dim ?? 4, t?.dim ?? 4, `${e.source}|${e.target}|${e.relation ?? "restricts"}`);
    return {
      source: e.source,
      target: e.target,
      restrictKind: kind,
      edgeDim: maps.edgeDim,
      Fsrc: maps.Fsrc,
      Ftgt: maps.Ftgt,
      translation: Array.from({ length: maps.edgeDim }, () => 0),
      residual: 0,
    };
  });
  const scored = recomputeResiduals(nodes, edges);
  const vDim = nodes.reduce((s, n) => s + n.dim, 0);
  const eDim = scored.reduce((s, e) => s + e.edgeDim, 0);
  const chi = eulerCharacteristic(nodes, scored);
  const deg = new Map(nodes.map((n) => [n.id, 0]));
  for (const e of scored) {
    deg.set(e.source, (deg.get(e.source) ?? 0) + 1);
    deg.set(e.target, (deg.get(e.target) ?? 0) + 1);
  }
  const known = new Set(nodes.filter((n) => n.known).map((n) => n.id));
  const holdIds = nodes
    .filter((n) => !known.has(n.id) && (deg.get(n.id) ?? 0) >= 2)
    .sort((a, b) => (deg.get(b.id) ?? 0) - (deg.get(a.id) ?? 0) || a.id.localeCompare(b.id))
    .slice(0, 8)
    .map((n) => n.id);
  const h0 = estimateH0(nodes, scored, H0_SAMPLES, H0_ITERS);
  const hold = holdoutTest(nodes, scored, holdIds, 56);
  const energy = scored.reduce((s, e) => s + e.residual * e.residual, 0);
  const terracotta = scored.filter((e) => e.restrictKind === "type-aware").length;
  const beatMargin = hold.sheaf.cos - hold.graph.cos;
  return {
    id: raw.id,
    nodes: nodes.length,
    edges: scored.length,
    terracotta,
    kinds: kindCount,
    vDim,
    eDim,
    chi,
    energy,
    radius: eDim ? energy / eDim : energy,
    h0,
    h0Capped: h0 >= H0_SAMPLES,
    h0Samples: H0_SAMPLES,
    h1: h0 >= chi ? h0 - chi : null,
    pinned: known.size,
    holdout: {
      n: hold.n,
      sheafCos: hold.sheaf.cos,
      graphCos: hold.graph.cos,
      neighborCos: hold.neighbor.cos,
      sheafMse: hold.sheaf.mse,
      graphMse: hold.graph.mse,
      beatMargin,
      ids: holdIds,
    },
    beatGraph: beatMargin > 0.01,
    isolation: {
      walker: raw.eval?.walker ?? null,
      lcelLeak: nodes.filter((n) => /langchain|lcel/i.test(`${n.id} ${n.title}`)).length,
    },
  };
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("eval-hermes.mjs")) {
  console.log(JSON.stringify(loadHermesNumeric(), null, 2));
}
