import type { SheafEdge, SheafNode, Vec3 } from "./types";

export const LAYER_Z = 5.1;
export const WORLD_R = 9.5;

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
    group.forEach((node, i) => {
      const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
      const ring = 2.6 + (3 - Number(level)) * 1.55 + Math.min(3.2, n * 0.22);
      const jitter = ((hash(node.id) % 1000) / 1000 - 0.5) * 0.55;
      pos[node.id] = {
        x: Math.cos(ang) * ring + jitter,
        y: level * LAYER_Z,
        z: Math.sin(ang) * (ring * 0.86) + jitter * 0.6,
      };
    });
  }
  return pos;
}

export function layoutForce(
  nodes: SheafNode[],
  edges: SheafEdge[],
  steps = 220,
): Record<string, Vec3> {
  const pos = seedPositions(nodes);
  const vel: Record<string, Vec3> = {};
  for (const n of nodes) vel[n.id] = { x: 0, y: 0, z: 0 };

  const ids = nodes.map((n) => n.id);
  const rest = 2.35;

  for (let s = 0; s < steps; s++) {
    const alpha = 1 - s / steps;
    for (let i = 0; i < ids.length; i++) {
      const a = ids[i]!;
      const pa = pos[a]!;
      for (let j = i + 1; j < ids.length; j++) {
        const b = ids[j]!;
        const pb = pos[b]!;
        let dx = pa.x - pb.x;
        let dy = (pa.y - pb.y) * 0.35;
        let dz = pa.z - pb.z;
        let d2 = dx * dx + dy * dy + dz * dz + 0.08;
        const inv = 1 / d2;
        const f = 18 * inv * alpha;
        dx *= f;
        dy *= f;
        dz *= f;
        vel[a]!.x += dx;
        vel[a]!.y += dy;
        vel[a]!.z += dz;
        vel[b]!.x -= dx;
        vel[b]!.y -= dy;
        vel[b]!.z -= dz;
      }
    }
    for (const e of edges) {
      const pa = pos[e.source];
      const pb = pos[e.target];
      if (!pa || !pb) continue;
      const dx = pb.x - pa.x;
      const dy = pb.y - pa.y;
      const dz = pb.z - pa.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
      const mag = 0.12 * (dist - rest) / dist;
      vel[e.source]!.x += dx * mag;
      vel[e.source]!.y += dy * mag * 0.25;
      vel[e.source]!.z += dz * mag;
      vel[e.target]!.x -= dx * mag;
      vel[e.target]!.y -= dy * mag * 0.25;
      vel[e.target]!.z -= dz * mag;
    }
    for (const n of nodes) {
      const p = pos[n.id]!;
      const v = vel[n.id]!;
      const targetY = n.level * LAYER_Z;
      v.y += (targetY - p.y) * 0.22;
      v.x += -p.x * 0.012;
      v.z += -p.z * 0.012;
      v.x *= 0.62;
      v.y *= 0.55;
      v.z *= 0.62;
      p.x += v.x;
      p.y += v.y;
      p.z += v.z;
    }
  }
  return pos;
}

export function nodeRadius(dim: number, scale: number): number {
  return (0.18 + dim * 0.042) * scale;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
