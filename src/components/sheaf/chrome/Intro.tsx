import { useSheaf } from "@/store/sheaf";

export function Intro() {
  const open = useSheaf((s) => s.introOpen);
  const dismiss = useSheaf((s) => s.dismissIntro);
  const setPrimer = useSheaf((s) => s.setPrimer);
  const setHelp = useSheaf((s) => s.setHelp);
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center bg-ink/40 p-4 pb-28 md:items-center md:pb-4">
      <div className="sheaf-panel w-full max-w-md rounded-2xl p-6">
        <p className="text-[11px] uppercase tracking-wider text-fg-subtle">
          Cellular sheaf explorer
        </p>
        <h2 className="mt-1 font-display text-3xl leading-tight">Stalks & Sections</h2>
        <p className="mt-3 text-sm leading-relaxed text-fg-muted">
          A hierarchical knowledge lattice. Nodes are vector spaces; edges are restriction
          maps. Click a named stalk to inspect it. Close, Esc, or an empty layer plane
          returns you to the lattice — you never leave the preview.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={dismiss}
            className="h-11 rounded-lg bg-fg px-4 text-sm font-medium text-bg"
          >
            Enter the lattice
          </button>
          <button
            type="button"
            onClick={() => {
              dismiss();
              setHelp(true);
            }}
            className="h-11 rounded-lg bg-bg-soft px-4 text-sm font-medium text-fg"
          >
            How to read this
          </button>
          <button
            type="button"
            onClick={() => {
              dismiss();
              setPrimer(true);
            }}
            className="h-11 rounded-lg px-3 text-sm font-medium text-fg-muted hover:text-fg"
          >
            Primer
          </button>
        </div>
      </div>
    </div>
  );
}
