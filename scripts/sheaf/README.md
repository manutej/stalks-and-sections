# `scripts/sheaf`

Portable generator. No extra npm dependencies.

| Command | Script |
| --- | --- |
| `npm run sheaf:generate -- --from <in> --out <out>` | `generate.mjs` |
| `npm run sheaf:generate -- --from-wiki <dir> --out <out>` | same |
| `npm run sheaf:examples` | regenerate shipped JSON |
| `npm run sheaf:validate -- <file.json>` | `validate.mjs` |
| `npm run sheaf:langchainjs` | `from-code.mjs` — stream a TS monorepo into a sheaf |

Algebra is duplicated here on purpose so the CLI does not load the Vite app. Keep `algebra.mjs` aligned with `src/lib/sheaf/{linear,maps,energy,rng}.ts`.

Docs: [`docs/GENERATE.md`](../../docs/GENERATE.md). Experiment write-up: [`docs/experiments/langchainjs.md`](../../docs/experiments/langchainjs.md).
