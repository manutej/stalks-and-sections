import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { estimateH0, makePair, recomputeResiduals } from "./algebra.mjs";
import { loadHermesNumeric } from "./eval-hermes.mjs";

function identityPath() {
  const nodes = [
    { id: "a", dim: 2, section: [1, 0], known: true, level: 0 },
    { id: "b", dim: 2, section: [1, 0], known: false, level: 1 },
    { id: "c", dim: 2, section: [1, 0], known: false, level: 2 },
  ];
  const mk = (s, t) => {
    const maps = makePair("identity", 2, 2, `${s}|${t}`);
    return {
      source: s,
      target: t,
      restrictKind: "identity",
      edgeDim: maps.edgeDim,
      Fsrc: maps.Fsrc,
      Ftgt: maps.Ftgt,
      translation: [0, 0],
      residual: 0,
    };
  };
  const edges = recomputeResiduals(nodes, [mk("a", "b"), mk("b", "c")]);
  return { nodes, edges };
}

describe("identity path sheaf kernel heuristic", () => {
  it("finds a global-section direction and kills it after a pin when energy is ~0", () => {
    const { nodes, edges } = identityPath();
    const energy = edges.reduce((s, e) => s + e.residual * e.residual, 0);
    assert.ok(energy < 1e-9, `energy ${energy}`);
    const h0 = estimateH0(nodes, edges, 6, 40);
    assert.ok(h0 >= 1, `h0=${h0}`);
    assert.ok(h0 <= 2, `h0=${h0} should not exceed stalk dim`);
  });
});

describe("Hermes adversarial eval v2", () => {
  const report = loadHermesNumeric();

  it("stays on the 113-stalk working set", () => {
    assert.equal(report.id, "hermes-agent");
    assert.equal(report.nodes, 113);
    assert.equal(report.edges, 112);
    assert.equal(report.terracotta, 10);
    assert.equal(report.pinned, 8);
    assert.equal(report.kinds.identity, 46);
    assert.equal(report.kinds.projection, 56);
    assert.equal(report.kinds["type-aware"], 10);
  });

  it("reports finite kernel and hold-out numbers", () => {
    assert.ok(Number.isFinite(report.chi));
    assert.ok(Number.isFinite(report.h0));
    assert.ok(report.h0 >= 0);
    assert.equal(report.holdout.n, 8);
    assert.ok(Number.isFinite(report.holdout.sheafCos));
    assert.ok(Number.isFinite(report.holdout.graphCos));
    assert.ok(Number.isFinite(report.holdout.neighborCos));
  });

  it("does not leak LCEL ids into the hold-out", () => {
    assert.equal(report.isolation.lcelLeak, 0);
    for (const id of report.holdout.ids) {
      assert.equal(/langchain|lcel/i.test(id), false, id);
    }
    assert.ok(String(report.isolation.walker ?? "").includes("emit-hermes.py"));
  });

  it("treats beatGraph as an observed bit, not a required win", () => {
    assert.equal(typeof report.beatGraph, "boolean");
  });
});
