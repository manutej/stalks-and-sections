# Example sheaves

Portable JSON graphs for the explorer. Schema: [`sheaf.schema.json`](sheaf.schema.json). How to build a new one: [`../GENERATE.md`](../GENERATE.md).

| File | Origin | Residual means |
| --- | --- | --- |
| `discourse-triangle.json` | hand-authored | Public agreement vs private disagreement |
| `toy-kg.json` | `npm run sheaf:examples` from `templates/kg/triples.json` | TransE triple violation |
| `wiki-integrity.json` | `npm run sheaf:examples` from `docs/sources` | Typed wiki-relation mismatch |
| `langchainjs.json` | `npm run sheaf:langchainjs` from [langchain-ai/langchainjs](https://github.com/langchain-ai/langchainjs) | LCEL-contract mismatch |
| `langchainjs-rich.json` | `npm run sheaf:rich` | Segmentation mismatch (package ⊂ module ⊂ API) |

Drop a new `*.json` here (not `sheaf.schema.json`). Restart the app. It appears in the dataset switcher.

Rules: every `section` coordinate has a domain meaning; no Gaussian padding; one-sentence `residualMeaning`.
