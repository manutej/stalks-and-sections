import { lazy, Suspense, useEffect, useState } from "react";

const SheafScene = lazy(() =>
  import("./Scene").then((m) => ({ default: m.SheafScene })),
);

export function GraphCanvas() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return <div className="h-full w-full bg-bg" aria-hidden />;
  }
  return (
    <div className="h-full w-full">
      <Suspense fallback={<div className="h-full w-full bg-bg" aria-hidden />}>
        <SheafScene />
      </Suspense>
    </div>
  );
}
