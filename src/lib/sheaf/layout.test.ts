import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { layoutExtent, layoutForce, LAYER_Z } from "./layout.ts";
import type { SheafEdge, SheafNode } from "./types.ts";

function fake(n: number, levels = 4): { nodes: SheafNode[]; edges: SheafEdge[] } {
  const nodes: SheafNode[] = [];
  const edges: SheafEdge[] = [];
  for (let i = 0; i < n; i++) {
    const level = i % levels;
    nodes.push({
      id: `n${i}`,
      title: `node ${i}`,
      kind: "module",
      level,
      dim: 8,
      section: Array.from({ length: 8 }, () => 0.1),
      known: level === 0,
      summary: "",
      sources: [],
    });
    if (i > 0) {
      edges.push({
        id: `e${i}`,
        source: `n${i}`,
        target: `n${i - 1}`,
        relation: "imports",
        restrictKind: "identity",
        edgeDim: 4,
        Fsrc: [],
        Ftgt: [],
        translation: [],
        residual: 0.2,
      });
    }
  }
  return { nodes, edges };
}

describe("layoutForce stays on the disks", () => {
  it("96-node 4-layer lattice does not explode", () => {
    const { nodes, edges } = fake(96);
    const pos = layoutForce(nodes, edges);
    const ext = layoutExtent(pos);
    assert.ok(ext < 22, `extent ${ext}`);
    for (const n of nodes) {
      const p = pos[n.id]!;
      assert.ok(Math.abs(p.y - n.level * LAYER_Z) < 1e-6, `y pin ${n.id}`);
      assert.ok(Math.hypot(p.x, p.z) < 18, `r ${n.id}`);
    }
    assert.equal(Object.keys(pos).length, 96);
  });
});
