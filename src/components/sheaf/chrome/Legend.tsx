import { levelHex } from "@/lib/sheaf/palette";
import { useSheaf } from "@/store/sheaf";
import { Hint } from "./Hint";

export function Legend() {
  const maxLevel = useSheaf((s) => s.maxLevel);
  const setMaxLevel = useSheaf((s) => s.setMaxLevel);
  const nodes = useSheaf((s) => s.nodes);
  const edges = useSheaf((s) => s.edges);
  const levels = useSheaf((s) => s.levels);

  return (
    <div className="sheaf-panel rounded-2xl p-3">
      <div className="flex items-center justify-between gap-1">
        <p className="text-[10px] uppercase tracking-wider text-fg-subtle">Hierarchy</p>
        <Hint k="depth" side="right" />
      </div>
      <p className="mt-1 text-[10px] leading-snug text-fg-subtle">
        Names follow the highlighted layer. Click a row to slice to it.
      </p>
      <ul className="mt-2 space-y-1">
        {levels.map((lv) => (
          <li key={lv.id}>
            <button
              type="button"
              onClick={() => setMaxLevel(lv.id)}
              className={`flex w-full items-center gap-2 rounded-lg px-1.5 py-1.5 text-left text-xs ${
                lv.id === maxLevel
                  ? "bg-bg-soft text-fg"
                  : lv.id < maxLevel
                    ? "text-fg"
                    : "text-fg-subtle"
              }`}
            >
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: levelHex(lv.id) }}
              />
              <span className="min-w-0 flex-1 truncate font-medium">{lv.label}</span>
              <span className="font-mono text-[10px] text-fg-muted">{lv.code}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-3 border-t border-line pt-3">
        <div className="flex items-center justify-between gap-1">
          <p className="text-[10px] uppercase tracking-wider text-fg-subtle">Residual</p>
          <Hint k="filter" side="right" />
        </div>
        <div
          className="mt-2 h-1.5 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, var(--color-res-lo), var(--color-res-mid), var(--color-res-hi))",
          }}
        />
        <div className="mt-1 flex justify-between text-[10px] text-fg-subtle">
          <span>consistent</span>
          <span>noisy</span>
        </div>
      </div>
      <div className="mt-3 border-t border-line pt-3">
        <div className="flex items-center justify-between gap-1">
          <p className="text-[10px] uppercase tracking-wider text-fg-subtle">Restriction</p>
          <Hint k="restrictKind" side="right" />
        </div>
        <ul className="mt-2 space-y-1.5 text-[10px] text-fg-muted">
          <li className="flex items-center gap-2">
            <svg width="28" height="8" aria-hidden>
              <line x1="0" y1="4" x2="28" y2="4" stroke="currentColor" strokeWidth="1.4" />
            </svg>
            Identity
          </li>
          <li className="flex items-center gap-2">
            <svg width="28" height="8" aria-hidden>
              <line
                x1="0"
                y1="4"
                x2="28"
                y2="4"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeDasharray="4 3"
              />
            </svg>
            Projection
          </li>
          <li className="flex items-center gap-2">
            <svg width="28" height="8" aria-hidden>
              <line
                x1="0"
                y1="4"
                x2="28"
                y2="4"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeDasharray="1.5 2.5"
              />
            </svg>
            Embed
          </li>
          <li className="flex items-center gap-2">
            <svg width="28" height="8" aria-hidden>
              <line x1="0" y1="4" x2="28" y2="4" stroke="currentColor" strokeWidth="1.4" />
              <polygon points="14,1 17,4 14,7 11,4" fill="currentColor" />
            </svg>
            Type-aware
          </li>
        </ul>
      </div>
      <p className="mt-3 font-mono text-[10px] text-fg-subtle">
        {nodes.length} stalks · {edges.length} restrictions
      </p>
      <p className="mt-1 text-[10px] leading-snug text-fg-subtle">
        Round ring = pinned. Hex ring = enterable room.
      </p>
    </div>
  );
}
