import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  estimateH0,
  eulerCharacteristic,
  holdoutTest,
  identityEdges,
  makePair,
  zeros,
} from "./algebra.mjs";

function pathSheaf(n, dim, cycle = false) {
  const nodes = Array.from({ length: n }, (_, i) => ({
    id: `v${i}`,
    dim,
    section: zeros(dim).map((_, k) => (k === 0 ? 1 : 0)),
    known: i === 0 || i === n - 1,
  }));
  const edges = [];
  const add = (a, b) => {
    const maps = makePair("identity", dim, dim, `${a}|${b}`);
    edges.push({
      source: a,
      target: b,
      relation: "edge",
      restrictKind: "identity",
      edgeDim: maps.edgeDim,
      Fsrc: maps.Fsrc,
      Ftgt: maps.Ftgt,
    });
  };
  for (let i = 0; i < n - 1; i++) add(`v${i}`, `v${i + 1}`);
  if (cycle) add(`v${n - 1}`, `v0`);
  return { nodes, edges };
}

describe("constant sheaf cohomology", () => {
  it("path: H0 ≈ dim, H1 ≈ 0", () => {
    const dim = 3;
    const { nodes, edges } = pathSheaf(4, dim, false);
    const h0 = estimateH0(nodes, edges, 10, 40);
    const chi = eulerCharacteristic(nodes, edges);
    const h1 = h0 - chi;
    assert.ok(h0 >= dim - 1 && h0 <= dim + 2, `h0=${h0}`);
    assert.ok(h1 <= 2, `h1=${h1} chi=${chi}`);
  });

  it("triangle: H1 rises vs the path", () => {
    const dim = 2;
    const path = pathSheaf(3, dim, false);
    const tri = pathSheaf(3, dim, true);
    const h1Path = estimateH0(path.nodes, path.edges, 8, 40) - eulerCharacteristic(path.nodes, path.edges);
    const h1Tri = estimateH0(tri.nodes, tri.edges, 8, 40) - eulerCharacteristic(tri.nodes, tri.edges);
    assert.ok(h1Tri >= h1Path, `triangle h1 ${h1Tri} vs path ${h1Path}`);
  });
});

describe("hold-out sheaf vs graph Laplacian", () => {
  it("typed projection carries a coord the graph mixes away", () => {
    const dim = 4;
    const mapsId = makePair("identity", dim, dim, "ab");
    const mapsP = makePair("projection", dim, dim, "bc");
    const nodes = [
      { id: "a", dim, section: [1, 0, 0, 0], known: true },
      { id: "b", dim, section: [1, 0.2, 0, 0], known: false },
      { id: "c", dim, section: [1, 0, 0, 0], known: true },
    ];
    const edges = [
      { source: "a", target: "b", relation: "e", restrictKind: "identity", edgeDim: mapsId.edgeDim, Fsrc: mapsId.Fsrc, Ftgt: mapsId.Ftgt },
      { source: "b", target: "c", relation: "e", restrictKind: "projection", edgeDim: mapsP.edgeDim, Fsrc: mapsP.Fsrc, Ftgt: mapsP.Ftgt },
    ];
    const h = holdoutTest(nodes, edges, ["b"], 60);
    assert.equal(h.n, 1);
    assert.ok(h.sheaf.cos > 0.5, `sheaf cos ${h.sheaf.cos}`);
    assert.ok(
      h.sheaf.cos + 1e-6 >= h.graph.cos - 0.25,
      `sheaf ${h.sheaf.cos} vs graph ${h.graph.cos}`,
    );
  });
});
