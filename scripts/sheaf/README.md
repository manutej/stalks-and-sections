# `scripts/sheaf`

Portable generator. No extra npm dependencies.

| Command | Script |
| --- | --- |
| `npm run sheaf:generate -- --from <in> --out <out>` | `generate.mjs` |
| `npm run sheaf:generate -- --from-wiki <dir> --out <out>` | same |
| `npm run sheaf:examples` | regenerate shipped JSON |
| `npm run sheaf:validate -- <file.json>` | `validate.mjs` |
| `npm run sheaf:hermes` | `emit-hermes.py` — playable 113-stalk Hermes digest + rooms. **Not** an AST. Never `from-code.mjs`. |
| `npm run sheaf:hermes:pack` | `pack-hermes.py` — compact review drop under `artifacts/hermes-ship113/` |
| `npm run sheaf:qa` | Playwright walk: lattice → `run_agent` room |
| `npm run sheaf:langchainjs` | `from-code.mjs` — stream a TS monorepo into a sheaf (**LangChain.js only**) |
| `npm run sheaf:rich` | `rich-index.mjs` — matched segmentations + hold-out / H⁰ / H¹ |

Algebra is duplicated here on purpose so the CLI does not load the Vite app. Keep `algebra.mjs` aligned with `src/lib/sheaf/{linear,maps,energy,rng}.ts`.

Docs: [`docs/GENERATE.md`](../../docs/GENERATE.md). Experiments: [`docs/experiments/`](../../docs/experiments/).
