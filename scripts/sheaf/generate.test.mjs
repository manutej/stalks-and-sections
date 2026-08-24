import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { buildFromInput, loadFrom, loadWikiDir, wikiToInput } from "./generate.mjs";
import { validateSheaf } from "./schema.mjs";
import { dirichletEnergy } from "./algebra.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

test("triples template compiles to a valid sheaf with a clean triple and a noisy skip", () => {
  const input = loadFrom(join(root, "templates/kg/triples.json"));
  const g = buildFromInput(input);
  const report = validateSheaf(g);
  assert.equal(report.ok, true, report.errors.join("; "));
  assert.equal(g.nodes.length, 4);
  assert.equal(g.edges.length, 4);
  const clean = g.edges.find((e) => e.source === "paris" && e.target === "france");
  const noisy = g.edges.find((e) => e.source === "paris" && e.target === "europe");
  assert.ok(clean, "capital_of edge");
  assert.ok(noisy, "skip edge");
  assert.ok(clean.residual < 1e-9, `clean residual ${clean.residual}`);
  assert.ok(noisy.residual > 0.5, `noisy residual ${noisy.residual}`);
  assert.ok(Number.isFinite(dirichletEnergy(g.nodes, g.edges)));
});

test("CSV topology compiles", () => {
  const input = loadFrom(join(root, "templates/kg/triples.csv"));
  const g = buildFromInput(input);
  assert.equal(g.edges.length, 4);
  assert.equal(validateSheaf(g).ok, true);
});

test("blank template is valid after generate", () => {
  const input = loadFrom(join(root, "templates/kg/nodes-edges.json"));
  const g = buildFromInput(input);
  assert.equal(validateSheaf(g).ok, true);
});

test("wiki folder yields pages and typed restrictions", () => {
  const pages = loadWikiDir(join(root, "docs/sources"));
  assert.ok(pages.length >= 8, `pages ${pages.length}`);
  const g = buildFromInput(wikiToInput(pages));
  const report = validateSheaf(g);
  assert.equal(report.ok, true, report.errors.join("; "));
  assert.ok(g.edges.length >= 10, `edges ${g.edges.length}`);
  assert.ok(g.nodes.some((n) => n.id === "cellular-sheaf"));
  assert.ok(g.edges.some((e) => e.relation === "is_a" && e.restrictKind === "projection"));
});

test("discourse-triangle JSON matches the schema", () => {
  const raw = JSON.parse(readFileSync(join(root, "docs/examples/discourse-triangle.json"), "utf8"));
  const report = validateSheaf(raw);
  assert.equal(report.ok, true, report.errors.join("; "));
});
