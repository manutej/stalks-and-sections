import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const raw = JSON.parse(readFileSync("docs/examples/hermes-agent.json", "utf8"));

describe("hermes-agent.json contract", () => {
  it("is a 113-stalk working set, not an AST", () => {
    assert.equal(raw.id, "hermes-agent");
    assert.equal(raw.nodes.length, 113);
    assert.equal(raw.edges.length, 112);
    assert.equal(raw.eval?.files, 3387);
    assert.ok(String(raw.eval?.walker ?? "").includes("emit-hermes.py"));
  });

  it("pins eight L0 waist stalks and ten terracotta claims", () => {
    const waist = raw.nodes.filter((n) => n.known && n.level === 0).map((n) => n.id);
    for (const id of [
      "run-agent",
      "tools-registry",
      "hermes-state",
      "toolsets",
      "model-tools",
      "runtime-provider",
      "system-prompt",
      "tools-approval",
    ]) {
      assert.ok(waist.includes(id), id);
    }
    assert.equal(waist.length, 8);
    const terracotta = raw.edges.filter((e) => e.restrictKind === "type-aware");
    assert.equal(terracotta.length, 10);
  });

  it("authors unique interiors and keeps pooledFrom", () => {
    const rooms = raw.rooms ?? {};
    assert.ok(Object.keys(rooms).length >= 10);
    const cli = raw.nodes.find((n) => n.id === "hermes-cli-main");
    assert.ok((cli?.pooledFrom ?? []).length >= 3);
    const loop = rooms["agent-conversation-loop"];
    const ids = new Set((loop?.nodes ?? []).map((n) => n.id));
    assert.ok(ids.has("turn-api"));
    assert.ok(ids.has("turn-prep"));
  });

  it("stays isolated from LCEL", () => {
    const leak = raw.nodes.filter((n) => /langchain|lcel/i.test(`${n.id} ${n.title}`));
    assert.equal(leak.length, 0);
  });
});
