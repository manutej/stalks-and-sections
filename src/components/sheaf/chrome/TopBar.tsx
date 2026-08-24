import { BookOpen, CircleHelp, Layers2, RotateCcw, Search } from "lucide-react";
import { useSheaf } from "@/store/sheaf";
import { Explained, Hint } from "./Hint";

export function TopBar() {
  const search = useSheaf((s) => s.search);
  const setSearch = useSheaf((s) => s.setSearch);
  const nodes = useSheaf((s) => s.nodes);
  const flyTo = useSheaf((s) => s.flyTo);
  const setPrimer = useSheaf((s) => s.setPrimer);
  const setPrinciples = useSheaf((s) => s.setPrinciples);
  const setHelp = useSheaf((s) => s.setHelp);
  const dataset = useSheaf((s) => s.dataset);
  const setDataset = useSheaf((s) => s.setDataset);
  const reset = useSheaf((s) => s.reset);
  const energy = useSheaf((s) => s.energy);
  const kicker = useSheaf((s) => s.kicker);

  const q = search.trim().toLowerCase();
  const hits = q
    ? nodes.filter((n) => n.title.toLowerCase().includes(q)).slice(0, 6)
    : [];

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30 p-3 md:p-4">
      <div className="pointer-events-auto flex flex-wrap items-center gap-2">
        <div className="sheaf-panel flex min-w-0 items-center gap-3 rounded-xl px-3.5 py-2">
          <div className="min-w-0">
            <p className="font-display text-[1.05rem] font-medium leading-tight tracking-tight">
              Stalks & Sections
            </p>
            <p className="truncate text-[11px] text-fg-muted">{kicker}</p>
          </div>
        </div>

        <div className="sheaf-panel relative min-w-0 flex-1 rounded-xl md:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-fg-subtle" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && hits[0]) {
                flyTo(hits[0].id);
                setSearch("");
              }
            }}
            placeholder="Search stalks"
            aria-label="Search stalks"
            className="h-10 w-full rounded-xl bg-transparent pl-9 pr-9 text-sm text-fg outline-none placeholder:text-fg-subtle"
          />
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2">
            <Hint k="search" side="bottom" />
          </span>
          {hits.length > 0 ? (
            <ul className="sheaf-panel absolute left-0 right-0 top-[calc(100%+6px)] z-40 overflow-hidden rounded-xl">
              {hits.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      flyTo(n.id);
                      setSearch("");
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-bg-soft"
                  >
                    <span>{n.title}</span>
                    <span className="font-mono text-[10px] text-fg-subtle">
                      {n.level === 0
                        ? "Foundations"
                        : n.level === 1
                          ? "Sheaf theory"
                          : n.level === 2
                            ? "Applications"
                            : "Integrity"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="sheaf-panel ml-auto flex items-center gap-1 rounded-xl p-1">
          <Explained k="lattice" side="bottom">
            <button
              type="button"
              onClick={() => setDataset("literature")}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                dataset === "literature" ? "bg-fg text-bg" : "text-fg-muted hover:text-fg"
              }`}
            >
              Lattice
            </button>
          </Explained>
          <Explained k="cobb" side="bottom">
            <button
              type="button"
              onClick={() => setDataset("cobb")}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                dataset === "cobb" ? "bg-fg text-bg" : "text-fg-muted hover:text-fg"
              }`}
            >
              Cobb graph
            </button>
          </Explained>
        </div>

        <div className="sheaf-panel hidden items-center gap-1 rounded-xl px-3 py-2 sm:flex">
          <span className="text-[10px] uppercase tracking-wider text-fg-subtle">Energy</span>
          <span className="tabular font-mono text-sm">{energy.toFixed(3)}</span>
          <Hint k="energy" side="bottom" />
        </div>

        <Explained k="primer" side="bottom">
          <button
            type="button"
            onClick={() => setPrimer(true)}
            className="sheaf-panel hidden h-10 items-center gap-1.5 rounded-xl px-3 text-xs text-fg-muted hover:text-fg md:flex"
          >
            <BookOpen className="size-3.5" />
            Primer
          </button>
        </Explained>
        <Explained k="principles" side="bottom">
          <button
            type="button"
            onClick={() => setPrinciples(true)}
            className="sheaf-panel hidden h-10 items-center gap-1.5 rounded-xl px-3 text-xs text-fg-muted hover:text-fg lg:flex"
          >
            <Layers2 className="size-3.5" />
            Principles
          </button>
        </Explained>
        <button
          type="button"
          onClick={() => setHelp(true)}
          className="sheaf-panel flex h-10 items-center gap-1.5 rounded-xl px-3 text-xs text-fg-muted hover:text-fg"
          aria-label="How to read this lattice"
        >
          <CircleHelp className="size-4" />
          <span className="hidden sm:inline">Guide</span>
        </button>
        <Explained k="reset" side="bottom">
          <button
            type="button"
            onClick={reset}
            className="sheaf-panel flex h-10 w-10 items-center justify-center rounded-xl text-fg-muted hover:text-fg"
            aria-label="Reset lattice"
          >
            <RotateCcw className="size-4" />
          </button>
        </Explained>
      </div>
    </header>
  );
}
