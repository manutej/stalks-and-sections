import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { graphFromJson } from "./from-json.ts";
import { buildRoom, canEnterRoom } from "./room.ts";

describe("hermes digest is a sheaf, not an AST", () => {
  const g = graphFromJson(
    JSON.parse(readFileSync("docs/examples/hermes-agent.json", "utf8")),
  );

  it("keeps pooledFrom and rooms on load", () => {
    assert.equal(g.id, "hermes-agent");
    assert.equal(g.nodes.length, 113);
    assert.equal(g.edges.length, 112);
    assert.ok(g.families && g.families.length === 12);
    assert.ok(g.rooms && Object.keys(g.rooms).length >= 8);
    const cli = g.nodes.find((n) => n.id === "hermes-cli-main");
    assert.ok((cli?.pooledFrom?.length ?? 0) >= 3);
    const terracotta = g.edges.filter((e) => e.restrictKind === "type-aware");
    assert.equal(terracotta.length, 10);
  });

  it("L0 pins are known and enterable as the waist room", () => {
    const pin = g.nodes.find((n) => n.id === "run-agent");
    assert.equal(pin?.known, true);
    assert.equal(pin?.level, 0);
    assert.equal(canEnterRoom(pin, g.edges, g.rooms), true);
    const room = buildRoom("run-agent", g.nodes, g.edges, g.rooms);
    assert.ok(room);
    assert.ok(room.nodes.length >= 8);
    assert.ok(room.nodes.some((n) => n.id === "run-agent" && n.known));
  });

  it("conversation-loop room unfolds turn_* interiors", () => {
    const room = buildRoom("agent-conversation-loop", g.nodes, g.edges, g.rooms);
    assert.ok(room);
    const ids = new Set(room.nodes.map((n) => n.id));
    assert.ok(ids.has("turn-api"));
    assert.ok(ids.has("turn-prep"));
    assert.ok(ids.has("subagent-lifecycle"));
  });

  it("a leaf stalk is not a door", () => {
    const leaf = g.nodes.find((n) => n.id === "soul-md");
    assert.equal(canEnterRoom(leaf, g.edges, g.rooms), false);
  });
});
