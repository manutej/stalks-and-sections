import { type ReactNode } from "react";
import { Filter, GitMerge, Radio, Waves } from "lucide-react";
import { LEVELS } from "@/lib/sheaf/palette";
import { useSheaf } from "@/store/sheaf";
import { Explained, Hint } from "./Hint";

export function Dock() {
  const maxLevel = useSheaf((s) => s.maxLevel);
  const setMaxLevel = useSheaf((s) => s.setMaxLevel);
  const stalkScale = useSheaf((s) => s.stalkScale);
  const setStalkScale = useSheaf((s) => s.setStalkScale);
  const consistency = useSheaf((s) => s.consistency);
  const setConsistency = useSheaf((s) => s.setConsistency);
  const filterNoise = useSheaf((s) => s.filterNoise);
  const setFilterNoise = useSheaf((s) => s.setFilterNoise);
  const noiseCut = useSheaf((s) => s.noiseCut);
  const setNoiseCut = useSheaf((s) => s.setNoiseCut);
  const showLabels = useSheaf((s) => s.showLabels);
  const setShowLabels = useSheaf((s) => s.setShowLabels);
  const diffuseNow = useSheaf((s) => s.diffuseNow);
  const exactNow = useSheaf((s) => s.exactNow);
  const poolNow = useSheaf((s) => s.poolNow);
  const pooled = useSheaf((s) => s.pooled);
  const dataset = useSheaf((s) => s.dataset);
  const energyLog = useSheaf((s) => s.energyLog);
  const setHelp = useSheaf((s) => s.setHelp);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 p-3 md:p-4">
      <div className="pointer-events-auto sheaf-panel mx-auto flex max-w-5xl flex-col gap-3 rounded-2xl p-3 md:flex-row md:items-end">
        <div className="grid flex-1 grid-cols-2 gap-3 md:grid-cols-4">
          <SliderField
            hint="depth"
            valueLabel={`L${maxLevel}`}
            caption={LEVELS[maxLevel]?.label ?? ""}
          >
            <input
              type="range"
              min={0}
              max={3}
              step={1}
              value={maxLevel}
              onChange={(e) => setMaxLevel(Number(e.target.value))}
              className="range-plain w-full"
              aria-label="Visible layers"
            />
          </SliderField>
          <SliderField hint="scale" valueLabel={stalkScale.toFixed(2)}>
            <input
              type="range"
              min={0.6}
              max={1.8}
              step={0.05}
              value={stalkScale}
              onChange={(e) => setStalkScale(Number(e.target.value))}
              className="range-plain w-full"
              aria-label="Node size"
            />
          </SliderField>
          <SliderField hint="consistency" valueLabel={consistency.toFixed(2)}>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={consistency}
              onChange={(e) => setConsistency(Number(e.target.value))}
              className="range-plain w-full"
              aria-label="Edge glow"
            />
          </SliderField>
          <SliderField hint="cut" valueLabel={noiseCut.toFixed(2)}>
            <input
              type="range"
              min={0.2}
              max={1}
              step={0.01}
              value={noiseCut}
              onChange={(e) => setNoiseCut(Number(e.target.value))}
              className="range-plain w-full"
              aria-label="Noise cut"
            />
          </SliderField>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Explained k="filter" side="top">
            <button
              type="button"
              onClick={() => setFilterNoise(!filterNoise)}
              className={`flex h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-medium ${
                filterNoise ? "bg-fg text-bg" : "bg-bg-soft text-fg"
              }`}
            >
              <Filter className="size-3.5" />
              Hide noise
            </button>
          </Explained>
          <Explained k="labels" side="top">
            <button
              type="button"
              onClick={() => setShowLabels(!showLabels)}
              className={`flex h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-medium ${
                showLabels ? "bg-fg text-bg" : "bg-bg-soft text-fg"
              }`}
            >
              Names
            </button>
          </Explained>
          <Explained k="diffuse" side="top">
            <button
              type="button"
              data-testid="diffuse"
              onClick={diffuseNow}
              className="flex h-10 items-center gap-1.5 rounded-lg bg-fg px-3 text-xs font-medium text-bg"
            >
              <Waves className="size-3.5" />
              Diffuse
            </button>
          </Explained>
          {dataset === "cobb" ? (
            <Explained k="exact" side="top">
              <button
                type="button"
                onClick={exactNow}
                className="flex h-10 items-center gap-1.5 rounded-lg bg-bg-soft px-3 text-xs font-medium text-fg"
              >
                <Radio className="size-3.5" />
                Exact solve
              </button>
            </Explained>
          ) : null}
          <Explained k="pool" side="top">
            <button
              type="button"
              onClick={poolNow}
              className={`flex h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-medium ${
                pooled ? "bg-fg text-bg" : "bg-bg-soft text-fg"
              }`}
            >
              <GitMerge className="size-3.5" />
              {pooled ? "Restore" : "Coarsen"}
            </button>
          </Explained>
          <button
            type="button"
            onClick={() => setHelp(true)}
            className="ml-auto flex h-10 items-center rounded-lg px-2.5 text-xs text-fg-muted hover:text-fg md:hidden"
          >
            Guide
          </button>
        </div>

        {energyLog.length > 1 ? <EnergySpark log={energyLog} /> : null}
      </div>
    </div>
  );
}

function SliderField({
  hint,
  valueLabel,
  caption,
  children,
}: {
  hint: "depth" | "scale" | "consistency" | "cut";
  valueLabel: string;
  caption?: string;
  children: ReactNode;
}) {
  const titles = {
    depth: "Layers",
    scale: "Node size",
    consistency: "Edge glow",
    cut: "Noise cut",
  } as const;
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wider text-fg-subtle">
        <span className="min-w-0 flex-1 truncate">{titles[hint]}</span>
        <span className="tabular font-mono text-fg-muted">{valueLabel}</span>
        <Hint k={hint} side="top" />
      </span>
      {children}
      {caption ? (
        <span className="mt-1 block truncate text-[10px] text-fg-muted">{caption}</span>
      ) : null}
    </label>
  );
}

function EnergySpark({ log }: { log: number[] }) {
  const w = 88;
  const h = 28;
  const max = Math.max(...log, 1e-6);
  const min = Math.min(...log);
  const span = Math.max(max - min, 1e-6);
  const pts = log
    .slice(-40)
    .map((v, i, a) => {
      const x = (i / Math.max(a.length - 1, 1)) * w;
      const y = h - ((v - min) / span) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} className="hidden shrink-0 text-l0 md:block" aria-hidden>
      <polyline fill="none" stroke="currentColor" strokeWidth="1.5" points={pts} />
    </svg>
  );
}
