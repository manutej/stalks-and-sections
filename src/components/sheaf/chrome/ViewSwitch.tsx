import type { LatticeView } from "@/lib/sheaf/types";
import { useSheaf } from "@/store/sheaf";
import { Hint } from "./Hint";

const VIEWS: { id: LatticeView; label: string }[] = [
  { id: "strata", label: "Strata" },
  { id: "matrix", label: "Matrix" },
  { id: "multiples", label: "×4" },
  { id: "spectral", label: "Spectral" },
];

export function ViewSwitch() {
  const view = useSheaf((s) => s.view);
  const setView = useSheaf((s) => s.setView);
  return (
    <div className="sheaf-panel flex items-center gap-0.5 rounded-xl p-1" data-testid="view-switch">
      {VIEWS.map((v) => (
        <button
          key={v.id}
          type="button"
          data-testid={`view-${v.id}`}
          onClick={() => setView(v.id)}
          className={`h-8 rounded-lg px-2.5 text-xs font-medium ${
            view === v.id ? "bg-fg text-bg" : "text-fg-muted hover:text-fg"
          }`}
        >
          {v.label}
        </button>
      ))}
      <Hint k="views" side="bottom" />
    </div>
  );
}
