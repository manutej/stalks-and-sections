import { X } from "lucide-react";
import { useSheaf } from "@/store/sheaf";
import { HINTS } from "./Hint";

const MOVES = [
  {
    title: "Look around",
    body: "Drag to orbit. Scroll or pinch to zoom. Search jumps the camera to a stalk.",
  },
  {
    title: "Open a stalk",
    body: "Click any node. The inspector shows its vector, neighbours, and restriction residuals.",
  },
  {
    title: "Leave a stalk",
    body: "Press Close, tap the dimmed lattice, click the same node again, or press Esc. You never need to leave the preview.",
  },
  {
    title: "Read the picture",
    body: "Hue is hierarchy (teal foundations → terracotta integrity). Size is stalk dimension. Line colour is residual: teal consistent, terracotta noisy.",
  },
];

const CONTROL_KEYS = [
  "lattice",
  "cobb",
  "depth",
  "scale",
  "consistency",
  "cut",
  "filter",
  "diffuse",
  "exact",
  "pool",
  "labels",
  "reset",
] as const;

export function GuideModal() {
  const open = useSheaf((s) => s.helpOpen);
  const setHelp = useSheaf((s) => s.setHelp);
  if (!open) return null;
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
      onClick={() => setHelp(false)}
    >
      <div
        role="dialog"
        aria-modal
        aria-label="How to read this lattice"
        className="sheaf-panel max-h-[min(84dvh,720px)] w-full max-w-lg overflow-hidden rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="font-display text-xl">How to read this</h2>
          <button
            type="button"
            onClick={() => setHelp(false)}
            className="flex h-10 items-center gap-1.5 rounded-lg bg-fg px-3 text-sm font-medium text-bg"
          >
            <X className="size-4" />
            Close
          </button>
        </div>
        <div className="sheaf-scroll max-h-[min(70dvh,620px)] space-y-5 overflow-y-auto px-5 py-4">
          <section className="space-y-3">
            {MOVES.map((m) => (
              <div key={m.title}>
                <h3 className="text-sm font-medium">{m.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-fg-muted">{m.body}</p>
              </div>
            ))}
          </section>
          <section>
            <h3 className="text-[10px] uppercase tracking-wider text-fg-subtle">
              Every control
            </h3>
            <ul className="mt-2 divide-y divide-line">
              {CONTROL_KEYS.map((k) => {
                const h = HINTS[k];
                return (
                  <li key={k} className="py-2.5">
                    <p className="text-sm font-medium">{h.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">{h.body}</p>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
