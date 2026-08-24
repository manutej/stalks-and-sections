import { useEffect, useMemo, useRef } from "react";
import { hashSeed, mulberry32 } from "@/lib/sheaf/rng";
import { orthonormalPair } from "@/lib/sheaf/linear";
import { LEVEL_HEX } from "@/lib/sheaf/palette";
import type { SheafNode } from "@/lib/sheaf/types";

export function StalkPlot({ node }: { node: SheafNode }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [e1, e2] = useMemo(
    () => orthonormalPair(node.dim, mulberry32(hashSeed(`basis:${node.id}`))),
    [node.dim, node.id],
  );
  const x = node.section.reduce((s, v, i) => s + v * (e1[i] ?? 0), 0);
  const y = node.section.reduce((s, v, i) => s + v * (e2[i] ?? 0), 0);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const w = c.width;
    const h = c.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = Math.min(w, h) * 0.32;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#10181c";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(232,236,232,0.08)";
    ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * scale * 0.7, 12);
      ctx.lineTo(cx + i * scale * 0.7, h - 12);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(12, cy + i * scale * 0.7);
      ctx.lineTo(w - 12, cy + i * scale * 0.7);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, scale, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(232,236,232,0.18)";
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, scale * 0.5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(232,236,232,0.35)";
    ctx.beginPath();
    ctx.moveTo(cx - scale * 1.15, cy);
    ctx.lineTo(cx + scale * 1.15, cy);
    ctx.moveTo(cx, cy - scale * 1.15);
    ctx.lineTo(cx, cy + scale * 1.15);
    ctx.stroke();

    const px = cx + x * scale;
    const py = cy - y * scale;
    ctx.strokeStyle = LEVEL_HEX[node.level];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(px, py);
    ctx.stroke();
    ctx.fillStyle = LEVEL_HEX[node.level];
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(232,236,232,0.55)";
    ctx.font = "11px 'IBM Plex Mono', monospace";
    ctx.fillText(`dim ${node.dim}`, 10, h - 10);
    ctx.fillText("e₁", w - 22, cy - 6);
    ctx.fillText("e₂", cx + 6, 16);
  }, [e1, e2, node.dim, node.level, node.section, x, y]);

  return (
    <canvas
      ref={ref}
      width={320}
      height={200}
      className="h-[140px] w-full rounded-md bg-bg-elev"
      aria-label={`Stalk of ${node.title} projected to a stable 2D basis`}
    />
  );
}
