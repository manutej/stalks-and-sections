import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { reviewSheet } from "./review.ts";

describe("reviewSheet compact 2D ledger", () => {
  const raw = JSON.parse(readFileSync("docs/examples/hermes-agent.json", "utf8"));
  const sheet = reviewSheet(raw);

  it("counts the working set", () => {
    assert.equal(sheet.id, "hermes-agent");
    assert.equal(sheet.stalks, 113);
    assert.equal(sheet.restrictions, 112);
    assert.equal(sheet.terracotta.length, 10);
    assert.equal(sheet.waist.length, 8);
    assert.equal(sheet.rooms.length, 10);
  });

  it("dedupes aliased interiors", () => {
    const waist = sheet.rooms.find((r) => r.id === "run-agent");
    assert.ok(waist);
    assert.ok(waist.aliases.length >= 1);
  });
});
