#!/usr/bin/env python3
"""Pack docs/examples/hermes-agent.json into a reviewable drop.

Canonical pretty JSON stays in docs/examples/. This writes the compact
review pack under artifacts/hermes-ship113/ and a zip beside it.
Never walks NousResearch/hermes-agent. Never calls from-code.mjs.
"""
from __future__ import annotations

import hashlib
import json
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "docs" / "examples" / "hermes-agent.json"
PACK = ROOT / "artifacts" / "hermes-ship113"
ZIP_PATH = ROOT / "artifacts" / "hermes-ship113.zip"

FAM = [
    "loop",
    "prompt",
    "tools",
    "state",
    "memory",
    "skills",
    "providers",
    "gateway",
    "cron",
    "acp",
    "mcp",
    "security",
]

L0_WAIST = [
    "run-agent",
    "tools-registry",
    "hermes-state",
    "toolsets",
    "model-tools",
    "runtime-provider",
    "system-prompt",
    "tools-approval",
]


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    h.update(path.read_bytes())
    return h.hexdigest()


def family_peak(section: list[float]) -> str:
    if not section:
        return ""
    i = max(range(min(len(section), len(FAM))), key=lambda k: section[k])
    return FAM[i]


def compact_node(n: dict) -> dict:
    pooled = n.get("pooledFrom") or []
    out = {
        "id": n["id"],
        "title": n.get("title"),
        "kind": n.get("kind"),
        "level": n.get("level"),
        "known": bool(n.get("known")),
        "peak": family_peak(n.get("section") or []),
    }
    if pooled:
        out["pooledFrom"] = len(pooled)
    return out


def room_signature(room: dict) -> str:
    return json.dumps(
        {
            "id": room.get("id"),
            "title": room.get("title"),
            "nodes": [n.get("id") for n in room.get("nodes") or []],
            "edges": [
                (e.get("source"), e.get("target"), e.get("restrictKind"))
                for e in room.get("edges") or []
            ],
        },
        sort_keys=True,
    )


def main() -> None:
    raw = json.loads(SRC.read_text())
    nodes = raw["nodes"]
    edges = raw["edges"]
    rooms = raw.get("rooms") or {}
    assert raw["id"] == "hermes-agent", raw["id"]
    assert len(nodes) == 113, len(nodes)
    assert len(edges) == 112, len(edges)
    ids = {n["id"] for n in nodes}
    assert len(ids) == 113
    for e in edges:
        assert e["source"] in ids and e["target"] in ids, e

    degree: dict[str, int] = {i: 0 for i in ids}
    kinds: dict[str, int] = {}
    rkind: dict[str, int] = {}
    levels: dict[int, int] = {}
    terracotta: list[dict] = []
    for n in nodes:
        kinds[n.get("kind", "?")] = kinds.get(n.get("kind", "?"), 0) + 1
        levels[int(n["level"])] = levels.get(int(n["level"]), 0) + 1
    for e in edges:
        degree[e["source"]] = degree.get(e["source"], 0) + 1
        degree[e["target"]] = degree.get(e["target"], 0) + 1
        rk = e.get("restrictKind", "?")
        rkind[rk] = rkind.get(rk, 0) + 1
        if rk == "type-aware":
            terracotta.append(
                {
                    "source": e["source"],
                    "target": e["target"],
                    "note": e.get("note", ""),
                }
            )
    assert len(terracotta) == 10, len(terracotta)

    unique: dict[str, dict] = {}
    aliases: dict[str, str] = {}
    seen: dict[str, str] = {}
    for key, room in rooms.items():
        sig = room_signature(room)
        if sig in seen:
            aliases[key] = seen[sig]
            continue
        seen[sig] = key
        unique[key] = {
            "title": room.get("title"),
            "kicker": room.get("kicker"),
            "nodes": len(room.get("nodes") or []),
            "edges": len(room.get("edges") or []),
            "ids": [n.get("id") for n in room.get("nodes") or []],
        }

    if PACK.exists():
        shutil.rmtree(PACK)
    PACK.mkdir(parents=True, exist_ok=True)

    min_path = PACK / "hermes-agent.min.json"
    min_path.write_text(json.dumps(raw, separators=(",", ":")) + "\n")
    # stable drop-in name used by earlier sessions
    ship = ROOT / "artifacts" / "hermes-agent.ship113.json"
    shutil.copyfile(min_path, ship)

    census = {
        "id": raw["id"],
        "title": raw.get("title"),
        "kicker": raw.get("kicker"),
        "clone": (raw.get("eval") or {}).get("clone"),
        "walker": (raw.get("eval") or {}).get("walker"),
        "workingSet": {
            "nodes": 113,
            "edges": 112,
            "levels": len(raw.get("levels") or []),
            "families": [f.get("id") for f in raw.get("families") or []],
            "note": "Visible working set, not an AST of 3387 files.",
        },
        "l0Waist": L0_WAIST,
        "kinds": kinds,
        "levels": {str(k): v for k, v in sorted(levels.items())},
        "restrictKinds": rkind,
        "rooms": {
            "keys": sorted(rooms),
            "uniqueInteriors": len(unique),
            "aliases": aliases,
        },
        "eval": raw.get("eval"),
        "nodes": [compact_node(n) | {"degree": degree.get(n["id"], 0)} for n in nodes],
        "edges": [
            {
                "source": e["source"],
                "target": e["target"],
                "restrictKind": e.get("restrictKind"),
                "note": e.get("note"),
            }
            for e in edges
        ],
    }
    (PACK / "hermes-agent.census.json").write_text(json.dumps(census, indent=2) + "\n")
    (PACK / "hermes-agent.rooms.json").write_text(
        json.dumps({"unique": unique, "aliases": aliases}, indent=2) + "\n"
    )
    (PACK / "hermes-agent.terracotta.json").write_text(
        json.dumps(terracotta, indent=2) + "\n"
    )

    pretty_sha = sha256(SRC)
    min_sha = sha256(min_path)
    manifest = {
        "id": "hermes-ship113",
        "dataset": "hermes-agent",
        "completePlayableIngest": {
            "stalks": 113,
            "restrictions": 112,
            "rooms": len(rooms),
            "uniqueInteriors": len(unique),
            "l0Waist": L0_WAIST,
        },
        "notAnAst": {
            "filesScored": (raw.get("eval") or {}).get("files"),
            "meaning": "113 is the working set. 3387 files are not one stalk each.",
        },
        "canonical": {
            "emitter": "scripts/sheaf/emit-hermes.py",
            "prettyJson": "docs/examples/hermes-agent.json",
            "prettySha256": pretty_sha,
        },
        "thisPack": {
            "minJson": "hermes-agent.min.json",
            "minBytes": min_path.stat().st_size,
            "minSha256": min_sha,
            "prettyBytes": SRC.stat().st_size,
        },
        "githubDrift": {
            "main": {
                "sha": "ec9ea9fd",
                "jsonBlob": "247340f5",
                "nodes": 31,
                "edges": 29,
            },
            "feat/hermes-94-land": {
                "sha": "0ac2509",
                "jsonBlob": "68a480d3",
                "content": "PLACEHOLDER_WILL_FAIL",
                "doNotMerge": True,
            },
            "issue": "https://github.com/manutej/stalks-and-sections/issues/16",
        },
        "isolation": {
            "datasetId": "hermes-agent",
            "forbiddenWalkers": [
                "scripts/sheaf/from-code.mjs",
                "scripts/sheaf/rich-index.mjs",
            ],
        },
    }
    (PACK / "MANIFEST.json").write_text(json.dumps(manifest, indent=2) + "\n")

    sums = PACK / "SHA256SUMS.txt"
    lines = [
        f"{pretty_sha}  docs/examples/hermes-agent.json",
        f"{min_sha}  hermes-agent.min.json",
        f"{sha256(PACK / 'hermes-agent.census.json')}  hermes-agent.census.json",
        f"{sha256(PACK / 'hermes-agent.rooms.json')}  hermes-agent.rooms.json",
        f"{sha256(PACK / 'hermes-agent.terracotta.json')}  hermes-agent.terracotta.json",
        f"{sha256(PACK / 'MANIFEST.json')}  MANIFEST.json",
    ]
    sums.write_text("\n".join(lines) + "\n")

    # durable docs copied so the zip is self-contained
    for src, name in (
        (ROOT / "docs" / "REVIEW.md", "REVIEW.md"),
        (ROOT / "docs" / "FILEMAP.md", "FILEMAP.md"),
        (ROOT / "docs" / "experiments" / "hermes-agent.md", "EVAL.md"),
        (ROOT / "docs" / "experiments" / "hermes-land.md", "LAND.md"),
        (ROOT / "docs" / "examples" / "sheaf.schema.json", "sheaf.schema.json"),
    ):
        if src.exists():
            shutil.copyfile(src, PACK / name)

    (PACK / "README.md").write_text(
        "\n".join(
            [
                "# hermes-ship113",
                "",
                "Review drop for the Hermes Agent cellular-sheaf digest.",
                "",
                "- **Playable ingest:** 113 stalks · 112 restrictions · 10 unique interiors (16 room keys).",
                "- **Not an AST** of 3387 files. Start at REVIEW.md.",
                "- **Canonical pretty JSON** lives in the repo at `docs/examples/hermes-agent.json`.",
                "- **This folder is generated.** Rebuild with `npm run sheaf:hermes:pack`.",
                "",
                "| File | Use |",
                "| --- | --- |",
                "| `REVIEW.md` | Front door |",
                "| `hermes-agent.min.json` | Drop-in compact ingest |",
                "| `hermes-agent.census.json` | Working-set index (no nested room graphs) |",
                "| `hermes-agent.rooms.json` | Unique interiors + aliases |",
                "| `hermes-agent.terracotta.json` | Ten type-aware claims |",
                "| `MANIFEST.json` | Counts, SHAs, GitHub drift |",
                "| `EVAL.md` | Honesty clause / sheaf vs AST |",
                "| `FILEMAP.md` | Canonical vs generated vs toxic |",
                "| `LAND.md` | How to land; do not merge PLACEHOLDER |",
                "| `SHA256SUMS.txt` | Checksums |",
                "",
                "QA screenshots (`hermes-lattice.png`, `hermes-room.png`) stay in this folder; they are omitted from the zip.",
                "",
                "Isolation: dataset id `hermes-agent`. Never `from-code.mjs`.",
                "",
            ]
        )
        + "\n"
    )

    shots = ROOT / "screenshots"
    for name in ("hermes-lattice.png", "hermes-room.png"):
        src = shots / name
        if src.exists():
            shutil.copyfile(src, PACK / name)

    if ZIP_PATH.exists():
        ZIP_PATH.unlink()
    with zipfile.ZipFile(ZIP_PATH, "w", zipfile.ZIP_DEFLATED) as z:
        for p in sorted(PACK.rglob("*")):
            if not p.is_file():
                continue
            if p.suffix.lower() == ".png":
                continue  # QA shots stay unpacked; zip is the compact drop
            z.write(p, arcname=f"hermes-ship113/{p.relative_to(PACK)}")

    print(
        json.dumps(
            {
                "ok": True,
                "nodes": 113,
                "edges": 112,
                "rooms": len(rooms),
                "uniqueInteriors": len(unique),
                "aliases": aliases,
                "terracotta": len(terracotta),
                "prettyBytes": SRC.stat().st_size,
                "minBytes": min_path.stat().st_size,
                "zipBytes": ZIP_PATH.stat().st_size,
                "pack": str(PACK.relative_to(ROOT)),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
