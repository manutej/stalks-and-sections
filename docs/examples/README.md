# Example sheaves

Portable JSON graphs for the explorer. Schema: [`sheaf.schema.json`](sheaf.schema.json). Contract and catalog: [`../../HANDOFF.md`](../../HANDOFF.md) §6–§7.

| File | Runnable in v1? | Residual means |
| --- | --- | --- |
| `discourse-triangle.json` | Not yet (needs JSON loader, issue #5) | Public agreement vs private disagreement |
| *(literature / cobb)* | Yes, hardcoded | See `src/lib/sheaf/lattice.ts`, `cobb.ts` |

Rules for new files: every `section` coordinate has a domain meaning; no Gaussian padding; one-sentence blurb that a reviewer could quote.
