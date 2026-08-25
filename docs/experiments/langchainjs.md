# LangChain.js sheaf experiment

Repo: [langchain-ai/langchainjs](https://github.com/langchain-ai/langchainjs)
Pinned contract: `langchain-core` runnables + messages (L0). Providers must restrict into that fibre.

## Scale (this run)

| | |
| --- | --- |
| Source files streamed | 1041 |
| LOC | 202,693 |
| Tokens | 367,626 |
| Lattice nodes (pooled modules) | 88 |
| Restriction edges | 531 |
| Stalk dim | 16 (LCEL/interface families, not LLM embeddings) |
| Dirichlet energy | 569.786 |
| Wall time | 1.0s |
| Heap | 38.9 MB |

Memory stays bounded because files are read line-by-line; only a 16-dim section and a 20-bit gram set survive per module. Hierarchical pooling (`file → module → lattice`) is what makes the explorer playable. A million-line Java tree would use the same pipeline: stream, hash, pool, glue.

## Sheaf vs AST compression

AST compression ratio (1 − unique identifier-trigrams / tokens): **50.1%**.
Wrappers look like wrappers. That is the point AST hashing *cannot* see.

| Ranker | Precision@15 | Gold LCEL-glue recall@20 |
| --- | --- | --- |
| Mean sheaf residual (contract edges) | 60% | **56%** (10/18) |
| AST entropy (least compressible) | 53% | 39% (7/18) |

Gold set = hand-labeled open issues that *are* gluing failures: dropped callbacks (#11372), streamEvents (#11396, #11355), withStructuredOutput drift (#10956, #10307, #11381, #6795), tool_call streaming (#11311, #11293), provider converters (#11444, #11341).

| [#11372](https://github.com/langchain-ai/langchainjs/issues/11372) | langchain-openai, langchain-google, langchain-aws, langchain-anthropic | yes |
| [#11396](https://github.com/langchain-ai/langchainjs/issues/11396) | langchain-anthropic | yes |
| [#11155](https://github.com/langchain-ai/langchainjs/issues/11155) | langchain-ollama | no |
| [#11326](https://github.com/langchain-ai/langchainjs/issues/11326) | langchain-aws | yes |
| [#11341](https://github.com/langchain-ai/langchainjs/issues/11341) | langchain-aws | yes |
| [#10956](https://github.com/langchain-ai/langchainjs/issues/10956) | langchain-google-genai | no |
| [#10307](https://github.com/langchain-ai/langchainjs/issues/10307) | langchain-google | no |
| [#11328](https://github.com/langchain-ai/langchainjs/issues/11328) | langchain-google-genai | no |
| [#11311](https://github.com/langchain-ai/langchainjs/issues/11311) | langchain-core | no |
| [#11355](https://github.com/langchain-ai/langchainjs/issues/11355) | langchain-core | no |
| [#11293](https://github.com/langchain-ai/langchainjs/issues/11293) | langchain-core, langchain-openai | yes |
| [#11444](https://github.com/langchain-ai/langchainjs/issues/11444) | langchain-google | no |
| [#11381](https://github.com/langchain-ai/langchainjs/issues/11381) | langchain-openai | yes |
| [#6795](https://github.com/langchain-ai/langchainjs/issues/6795) | langchain-openai, langchain-google, langchain-anthropic | yes |
| [#11332](https://github.com/langchain-ai/langchainjs/issues/11332) | langchain-openai | yes |
| [#11409](https://github.com/langchain-ai/langchainjs/issues/11409) | langchain-openrouter | yes |
| [#11417](https://github.com/langchain-ai/langchainjs/issues/11417) | langchain-openrouter | yes |
| [#11351](https://github.com/langchain-ai/langchainjs/issues/11351) | langchain-mcp-adapters | no |

## Loudest modules (harmonic mismatch)

| Module | Mean residual | AST entropy | Issue hits | Issues |
| --- | --- | --- | --- | --- |
| `langchain-core/singletons` | 1.887 | 88.3% | 4 | #10558 #11311 #11293 #10907 |
| `langchain-core/testing` | 1.763 | 66.5% | 4 | #10558 #11311 #11293 #10907 |
| `langchain-core/tracers` | 1.280 | 59.4% | 4 | #10558 #11311 #11293 #10907 |
| `langchain-classic/prompts` | 1.265 | 75.3% | 0 | — |
| `langchain-ibm/embeddings` | 1.210 | 82.0% | 0 | — |
| `langchain-pinecone/index` | 1.195 | 84.6% | 0 | — |
| `langchain-core/retrievers` | 1.180 | 84.1% | 4 | #10558 #11311 #11293 #10907 |
| `langchain-openrouter/chat_models` | 1.138 | 71.0% | 2 | #11417 #11409 |
| `langchain-core/output_parsers` | 1.135 | 72.9% | 4 | #10558 #11311 #11293 #10907 |
| `langchain-ibm/agents` | 1.123 | 93.6% | 0 | — |

## What to do in the explorer

Load **LangChain.js LCEL sheaf**. Peel to L0 to read the pinned contract. Raise layers to see provider wrappers. Terracotta edges into core are predicted refactor sites. Diffuse will not move L0; it pulls unknown wrappers toward the contract so leftover obstruction stays visible.

Residual meaning: Interface mismatch vs the pinned LCEL contract: a wrapper that looks locally like ChatModel (low AST entropy) but does not restrict invoke/stream/callbacks/structured-output into core.
