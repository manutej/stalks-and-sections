import { cobbGraph } from "./cobb";
import { graphFromJson } from "./from-json";
import { literatureGraph } from "./lattice";
import type { DatasetMeta, SheafGraph } from "./types";

const jsonModules = import.meta.glob("../../../docs/examples/*.json", {
  eager: true,
  import: "default",
}) as Record<string, unknown>;

const jsonGraphs = new Map<string, SheafGraph>();
for (const [path, raw] of Object.entries(jsonModules)) {
  if (path.endsWith("sheaf.schema.json")) continue;
  try {
    const g = graphFromJson(raw);
    jsonGraphs.set(g.id, g);
  } catch (err) {
    console.warn(`[sheaf] skip ${path}:`, err);
  }
}

export const DATASETS: DatasetMeta[] = [
  {
    id: "literature",
    label: "Lattice",
    hint: "lattice",
    builtin: true,
  },
  {
    id: "cobb",
    label: "Cobb",
    hint: "cobb",
    builtin: true,
  },
  ...[...jsonGraphs.values()].map((g) => ({
    id: g.id,
    label: g.title,
    hint: "dataset" as const,
    builtin: false,
  })),
];

export function loadGraph(id: string): SheafGraph {
  if (id === "cobb") return cobbGraph();
  if (id === "literature") return literatureGraph();
  const g = jsonGraphs.get(id);
  if (g) return g;
  return literatureGraph();
}

export function datasetMeta(id: string): DatasetMeta | undefined {
  return DATASETS.find((d) => d.id === id);
}
