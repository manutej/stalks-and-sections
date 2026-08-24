import { useEffect } from "react";
import { GraphCanvas } from "./canvas/GraphCanvas";
import { CueBar } from "./chrome/CueBar";
import { Dock } from "./chrome/Dock";
import { GuideModal } from "./chrome/Guide";
import { Inspector } from "./chrome/Inspector";
import { Intro } from "./chrome/Intro";
import { Legend } from "./chrome/Legend";
import { PrimerModal } from "./chrome/Primer";
import { TopBar } from "./chrome/TopBar";
import { useSheaf } from "@/store/sheaf";

export function SheafApp() {
  const hydrate = useSheaf((s) => s.hydrate);
  const closeOverlays = useSheaf((s) => s.closeOverlays);
  const mobilePanel = useSheaf((s) => s.mobilePanel);
  const introOpen = useSheaf((s) => s.introOpen);
  const dismissIntro = useSheaf((s) => s.dismissIntro);
  const selectedId = useSheaf((s) => s.selectedId);
  const select = useSheaf((s) => s.select);
  const setMobilePanel = useSheaf((s) => s.setMobilePanel);
  const diffuseNow = useSheaf((s) => s.diffuseNow);
  const poolNow = useSheaf((s) => s.poolNow);
  const reset = useSheaf((s) => s.reset);
  const setHelp = useSheaf((s) => s.setHelp);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "Escape") {
        if (introOpen) {
          dismissIntro();
          return;
        }
        closeOverlays();
      }
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setHelp(true);
      }
      if (e.key === "d") diffuseNow();
      if (e.key === "p") poolNow();
      if (e.key === "r") reset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeOverlays, introOpen, dismissIntro, diffuseNow, poolNow, reset, setHelp]);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-bg text-fg">
      <div
        className={`absolute inset-0 z-0 ${introOpen ? "pointer-events-none" : ""}`}
        aria-hidden={introOpen}
      >
        <GraphCanvas />
      </div>

      {!introOpen ? (
        <>
          <TopBar />
          <CueBar />
          <div className="pointer-events-none absolute bottom-36 left-3 top-24 z-20 hidden w-52 md:block lg:w-56">
            <div className="pointer-events-auto">
              <Legend />
            </div>
          </div>
          <div className="pointer-events-none absolute bottom-36 right-3 top-24 z-20 hidden w-72 md:block lg:w-80">
            <Inspector className="pointer-events-auto h-full" />
          </div>
          {mobilePanel === "inspect" && selectedId ? (
            <div className="absolute inset-0 z-30 md:hidden">
              <button
                type="button"
                className="absolute inset-0 bg-ink/35"
                aria-label="Return to lattice"
                onClick={() => {
                  select(null);
                  setMobilePanel("none");
                }}
              />
              <div className="absolute inset-x-3 bottom-28 max-h-[48dvh]">
                <Inspector className="max-h-[48dvh]" />
              </div>
            </div>
          ) : null}
          <Dock />
        </>
      ) : null}

      <Intro />
      <PrimerModal />
      <GuideModal />
    </main>
  );
}
