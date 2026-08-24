import { useSheaf } from "@/store/sheaf";

export function Intro() {
  const open = useSheaf((s) => s.introOpen);
  const dismiss = useSheaf((s) => s.dismissIntro);
  const setPrimer = useSheaf((s) => s.setPrimer);
  const setHelp = useSheaf((s) => s.setHelp);
  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-[100] flex items-center justify-center bg-ink/55 p-4 pt-8 pb-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-title"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
          e.stopPropagation();
          dismiss();
        }
      }}
    >
      <div
        className="sheaf-panel w-full max-w-md rounded-2xl p-6"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <p className="text-[11px] uppercase tracking-wider text-fg-subtle">
          Cellular sheaf explorer
        </p>
        <h2 id="intro-title" className="mt-1 font-display text-3xl leading-tight">
          Stalks & Sections
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-fg-muted">
          A hierarchical knowledge lattice. Nodes are vector spaces; edges are restriction
          maps. Click a named stalk to inspect it. Close, Esc, or an empty layer plane
          returns you to the lattice — you never leave the preview.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            data-testid="enter-lattice"
            autoFocus
            onClick={dismiss}
            onPointerDown={(e) => e.stopPropagation()}
            className="relative z-10 h-12 min-w-[10.5rem] rounded-lg bg-fg px-5 text-sm font-medium text-bg"
          >
            Enter the lattice
          </button>
          <button
            type="button"
            onClick={() => {
              dismiss();
              setHelp(true);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="h-12 rounded-lg bg-bg-soft px-4 text-sm font-medium text-fg"
          >
            How to read this
          </button>
          <button
            type="button"
            onClick={() => {
              dismiss();
              setPrimer(true);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="h-12 rounded-lg px-3 text-sm font-medium text-fg-muted hover:text-fg"
          >
            Primer
          </button>
        </div>
      </div>
    </div>
  );
}
