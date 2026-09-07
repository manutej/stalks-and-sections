# Land the 113-node Hermes digest

Do this only after a human confirms. Production `?g=hermes-agent` still serves the **31-node** digest on `main`.

## Do not

- Merge `feat/hermes-94-land` as it stands. The blob is the literal string `PLACEHOLDER_WILL_FAIL` (SHA `68a480d3`). `graphFromJson` will throw.
- Overwrite `main` with a JSON-only commit if the room runtime (`src/lib/sheaf/room.ts` and friends) is not in the same commit — 113 stalks will load, rooms will not.
- Point Hermes at `scripts/sheaf/from-code.mjs` or `rich-index.mjs`.

## What must land together

**Ingest**

- `scripts/sheaf/emit-hermes.py`
- `docs/examples/hermes-agent.json` (113 / 112 / rooms)
- `docs/examples/sheaf.schema.json` (`pooledFrom`, `families`, `rooms`)

**Runtime**

- `src/lib/sheaf/types.ts`
- `src/lib/sheaf/from-json.ts` (preserve `pooledFrom`, parse `rooms`)
- `src/lib/sheaf/room.ts`
- `src/lib/sheaf/index.ts`
- `src/lib/sheaf/catalog.ts` (hermes first)
- `src/lib/sheaf/layout.ts`
- `src/lib/sheaf/palette.ts`
- `src/store/sheaf.ts` (`?g=` hydrate, default dataset, `roomStack`)

**Chrome**

- `src/components/sheaf/SheafApp.tsx`
- `src/components/sheaf/canvas/Scene.tsx`
- `src/components/sheaf/chrome/{Inspector,TopBar,CueBar,Hint,Guide,Legend,Intro}.tsx`

**Review / QA**

- `src/lib/sheaf/from-json.test.ts`
- `src/lib/sheaf/layout.test.ts`
- `scripts/qa-hermes-room.mjs`
- `docs/REVIEW.md`
- `docs/FILEMAP.md`
- `docs/experiments/hermes-agent.md`
- `docs/experiments/hermes-land.md`
- `src/lib/sheaf/review.ts`
- `package.json` scripts `sheaf:hermes` / `sheaf:hermes:pack` / `sheaf:qa`

**Optional generated (rebuild after emit)**

- `artifacts/hermes-ship113/**`

## Suggested git sequence

1. New branch from current GitHub `main` (`ec9ea9fd`), **not** from `feat/hermes-94-land`.
   Name: `feat/hermes-ship113`.
2. Copy the files above. Drop-in minified JSON is `artifacts/hermes-ship113/hermes-agent.min.json` if a reviewer wants the compact blob; the repo copy stays pretty.
3. Close or retarget [issue #16](https://github.com/manutej/stalks-and-sections/issues/16). Delete or force-fix `feat/hermes-94-land` so nobody merges the placeholder.
4. Open a PR. Merge to `main` only after `npm run sheaf:hermes` and the room QA pass.
5. Production preview `?g=hermes-agent` must then read **113 stalks · 112 restrictions**, never 31, never 3387.

## Accept after land

HUD kicker: `113 stalks · 112 restrictions · rooms inside fat stalks`.

Search `run_agent` → Enter room → eight pinned stalks, breadcrumb Hermes › run_agent.py AIAgent.

Zero LCEL node ids on the Hermes dataset.
