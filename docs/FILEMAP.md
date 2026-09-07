# File map

Canonical sources live in the repo. Generated review drops live under `artifacts/` (gitignored). Do not hand-edit generated files.

Front door for this build: [`docs/REVIEW.md`](REVIEW.md).

## Workspace

```
docs/
  REVIEW.md                    start here
  FILEMAP.md                   this map
  ARCHITECTURE.md              algebra + view
  GENERATE.md                  JSON contract / CLI
  DATASETS.md                  how to add a graph
  examples/                    loadable sheaves (catalog glob)
    hermes-agent.json          THIS digest (pretty, git-diffable)
    sheaf.schema.json          rooms, pooledFrom, families
    langchainjs.json           LCEL — isolated
    langchainjs-rich.json      LCEL rich index — isolated
    discourse-triangle.json
    toy-kg.json
    wiki-integrity.json
  experiments/                 eval write-ups, not loadable
    hermes-agent.md            honesty clause / sheaf vs AST
    hermes-land.md             land checklist
    langchainjs.md             LCEL experiment (do not mix)
  sources/                     literature notes (canonical)

src/lib/sheaf/                 algebra (client-only)
  from-json.ts                 zeros for missing sections; maps from restrictKind
  room.ts                      enter-room: authored ≥ pooledFrom ≥ 1-hop
  review.ts                    2D review sheet (claims + interiors)
  catalog.ts                   hermes-agent first among JSON datasets
  maps.ts                      identity / projection / embed / spectral / type-aware

src/store/sheaf.ts             default dataset hermes-agent; ?g=; roomStack
src/components/sheaf/          lattice + chrome (Review ledger / Enter room)

scripts/sheaf/
  emit-hermes.py               Hermes emitter (Python, authored)
  pack-hermes.py               compact + zip the review pack
  from-code.mjs                LangChain.js only
  rich-index.mjs               LangChain.js only
  validate.mjs                 JSON contract

artifacts/                     generated — npm run sheaf:hermes:pack
screenshots/                   Playwright QA evidence
attachments/                   original source dumps (gitignored; do not edit)
```

## Hermes digest — three layers

| Layer | Path | Role |
| --- | --- | --- |
| **Canonical emitter** | [`scripts/sheaf/emit-hermes.py`](../scripts/sheaf/emit-hermes.py) | Source of truth. Edit this, then emit. |
| **Playable ingest** | [`docs/examples/hermes-agent.json`](examples/hermes-agent.json) | Pretty JSON the explorer loads. 113 stalks · 112 restrictions · 16 room keys. |
| **Review pack** | `artifacts/hermes-ship113/` | Minified JSON, census, terracotta list, eval, zip. Generated. Not a second source of truth. |

```bash
npm run sheaf:hermes        # emit + validate
npm run sheaf:hermes:pack   # compact review drop
npm run sheaf:qa            # Playwright: lattice → enter room
```

Never regenerate Hermes with `from-code.mjs` or `rich-index.mjs`. Those are LangChain.js.

## Canonical vs scratch vs toxic

| Path | Keep | Why |
| --- | --- | --- |
| `scripts/sheaf/emit-hermes.py` | canonical | Only legal writer of the digest |
| `docs/examples/hermes-agent.json` | canonical | What `?g=hermes-agent` loads |
| `src/lib/sheaf/room.ts` | canonical | Room runtime |
| `src/lib/sheaf/review.ts` | canonical | 2D review sheet |
| `docs/experiments/hermes-agent.md` | canonical | Eval a reviewer can quote |
| `docs/REVIEW.md` | canonical | Front door |
| `artifacts/hermes-ship113/**` | generated | Rebuild with pack. Zip omits PNG shots. |
| `screenshots/hermes-*.png` | QA evidence | Playwright; not the digest |
| `attachments/` | scratch | Duplicate of `docs/sources/`; gitignored |
| `.project_id` | scratch | Platform; ignore |
| `feat/hermes-94-land` on GitHub | **toxic** | Blob is `PLACEHOLDER_WILL_FAIL` — do not merge |

## Isolation (Hermes ≠ LangChain.js)

| | Hermes | LangChain.js |
| --- | --- | --- |
| Dataset id | `hermes-agent` | `langchainjs`, `langchainjs-rich` |
| Emitter | `emit-hermes.py` | `from-code.mjs` / `rich-index.mjs` |
| Node ids | `run-agent`, `tools-registry`, … | LCEL module ids |
| Default boot | hermes-agent | never |

If a Hermes ingest route ever calls `from-code.mjs`, that is a bug.

## GitHub drift (do not paper over)

| Ref | `docs/examples/hermes-agent.json` |
| --- | --- |
| This workspace | 113 nodes, 112 edges, 16 rooms, walker `emit-hermes.py` |
| `main` @ `ec9ea9fd` | **31 nodes, 29 edges**, walker `from-hermes.mjs`, SHA `247340f5` |
| `feat/hermes-94-land` @ `0ac2509` | literal `PLACEHOLDER_WILL_FAIL`, SHA `68a480d3` — **will crash `graphFromJson`** |

Issue: [manutej/stalks-and-sections#16](https://github.com/manutej/stalks-and-sections/issues/16).

Land steps: [`docs/experiments/hermes-land.md`](experiments/hermes-land.md). Confirm before merging to `main`. Never merge the placeholder branch as-is.

## What “complete” means here

The playable ingest is **113 stalks · 112 restrictions** plus the L0 waist

`run-agent` / `tools-registry` / `hermes-state` / `toolsets` / `model-tools` / `runtime-provider` / `system-prompt` / `tools-approval`

and authored interiors (rooms) for fat stalks. It is **not** an AST of 3387 files. See [`docs/experiments/hermes-agent.md`](experiments/hermes-agent.md).
