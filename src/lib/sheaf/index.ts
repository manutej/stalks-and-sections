import { cobbGraph } from "./cobb";
import { literatureGraph } from "./lattice";
import type { DatasetId, SheafGraph } from "./types";

export function loadGraph(id: DatasetId): SheafGraph {
  return id === "cobb" ? cobbGraph() : literatureGraph();
}

export { cobbGraph } from "./cobb";
export { literatureGraph } from "./lattice";
export { diffuse } from "./diffuse";
export { hierarchicalPool } from "./pool";
export { closedFormTransE } from "./closed-form";
export { dirichletEnergy, recomputeResiduals, nodeMeanResidual } from "./energy";
export { layoutForce, nodeRadius, LAYER_Z } from "./layout";
export * from "./types";
export * from "./palette";
