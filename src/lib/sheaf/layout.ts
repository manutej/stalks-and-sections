import type { SheafEdge, SheafNode, Vec3 } from "./types";

export const LAYER_Z = 6.8;
export const WORLD_R = 18;

export function seedPositions(nodes: SheafNode[]): Record<string, Vec3> {
  const byLevel = new Map<number, SheafNode[]>();
  for (const n of nodes) {
    const g = byLevel.get(n.level) ?? [];
    g.push(n);
    byLevel.set(n.level, g);
  }
  const pos: Record<string, Vec3> = {};
  for (const [level, group] of byLevel) {
    const n = group.length;
    const ring = layerRadius(level, n) - 2.2;
    group.forEach((node, i) => {
      const ang = (i / Math.max(n, 1)) * Math.PI * 2 - Math.PI / 2;
      const jitter = ((hash(node.id) % 1000) / 1000 - 0.5) * 0.28;
      pos[node.id] = {
        x: Math.cos(ang) * ring + jitter,
        y: level * LAYER_Z,
        z: Math.sin(ang) * ring + jitter * 0.4,
      };
    });
  }
  return pos;
}

/**
 * Intra-layer spacing + hard Y pin + radial clamp.
 * Cross-layer all-pairs repulsion is unstable at n≈100.
 * Ring grows with count so a 113-stalk working set stays readable;
 * rooms (spaces inside stalks) are how density is navigated, not a node cap.
 */
export function layoutForce(
  nodes: SheafNode[],
  edges: SheafEdge[],
  steps = 80,
): Record<string, Vec3> {
  const pos = seedPositions(nodes);
  const byLevel = new Map<number, SheafNode[]>();
  const counts = new Map<number, number>();
  for (const n of nodes) {
    const g = byLevel.get(n.level) ?? [];
    g.push(n);
    byLevel.set(n.level, g);
  }
  for (const [lv, g] of byLevel) counts.set(lv, g.length);

  for (let s = 0; s < steps; s++) {
    const alpha = 1 - s / steps;
    for (const group of byLevel.values()) {
      for (let i = 0; i < group.length; i++) {
        const a = pos[group[i]!.id]!;
        for (let j = i + 1; j < group.length; j++) {
          const b = pos[group[j]!.id]!;
          let dx = a.x - b.x;
          let dz = a.z - b.z;
          const d2 = dx * dx + dz * dz + 0.2;
          const f = Math.min(0.9, (2.2 / d2) * alpha);
          dx *= f;
          dz *= f;
          a.x += dx;
          a.z += dz;
          b.x -= dx;
          b.z -= dz;
        }
      }
    }
    for (const e of edges) {
      const a = pos[e.source];
      const b = pos[e.target];
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const dist = Math.hypot(dx, dz) || 1;
      const mag = 0.03 * ((dist - 4.5) / dist) * alpha;
      a.x += dx * mag;
      a.z += dz * mag;
      b.x -= dx * mag;
      b.z -= dz * mag;
    }
    for (const n of nodes) {
      const p = pos[n.id]!;
      p.y = n.level * LAYER_Z;
      const R = layerRadius(n.level, counts.get(n.level) ?? 1) * 0.86;
      const r = Math.hypot(p.x, p.z) || 1;
      if (r > R) {
        p.x *= R / r;
        p.z *= R / r;
      }
    }
  }
  return pos;
}

export function nodeRadius(dim: number, scale: number): number {
  const d = Math.min(Math.max(dim, 2), 12);
  return (0.28 + d * 0.03) * scale;
}

export function layerRadius(level: number, count: number): number {
  const n = Math.max(count, 1);
  const ring = 4.2 + (3 - level) * 1.15 + Math.min(8.2, Math.sqrt(n) * 1.42);
  return ring + 2.4;
}

export function layoutExtent(pos: Record<string, Vec3>): number {
  let m = 0;
  for (const p of Object.values(pos)) m = Math.max(m, Math.hypot(p.x, p.z), Math.abs(p.y));
  return m;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
