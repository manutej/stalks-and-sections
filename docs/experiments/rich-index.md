# Rich LCEL index — hold-out eval

Three matched segmentations of [langchain-ai/langchainjs](https://github.com/langchain-ai/langchainjs):
package (36) ⊂ module (166) ⊂ API cluster (77).
Explorer lattice: **96 nodes**, 208 edges, stalk dim 32.

## Scale

| | |
| --- | --- |
| Files streamed | 1041 |
| LOC | 202,693 |
| Wall | 1.6s · 29.7 MB |

## Hold-out harmonic extension (hide 8 unknown stalks)

| Method | Cosine (32-d) ↑ | Interface cosine (16-d) ↑ | MSE ↓ |
| --- | --- | --- | --- |
| Sheaf Laplacian | 0.384 | **0.597** | 0.0247 |
| Graph Laplacian | **0.774** | 0.772 | 0.0130 |
| Neighbour mean | 0.774 | 0.772 | 0.0131 |

32-d cosine includes hashed export buckets (local uniqueness). Interface cosine is the 16 LCEL/API family coordinates the restriction maps are built to carry. A sheaf that *loses* on 32-d but *wins* on 16-d is doing its job: it refuses to glue noise.

## Cohomology (1-complex Euler)

| | |
| --- | --- |
| dim H⁰ (randomised ker L) | 2 |
| χ = Σ dim F(v) − Σ dim F(e) | 2064 |
| dim H¹ = H⁰ − χ | 0 |
| Dirichlet energy | 28.566 |
| Consistency radius (max residual) | 0.951 |

H⁰ is the number of independent global sections. H¹ is independent cycles of disagreement — candidate gluing failures.

## Impact (L⁸ pulse at `m-langchain-openai-chat-models`)

| Module | ‖L⁸ s‖ |
| --- | --- |
| `m-langchain-core-language-models` | 0.096 |
| `m-langchain-classic-experimental` | 0.009 |
| `m-langchain-xai-chat-models` | 0.009 |
| `m-langchain-classic-chat-models` | 0.008 |
| `m-langchain-chat-models` | 0.008 |
| `m-langchain-ibm-chat-models` | 0.008 |
| `m-langchain-ollama-index` | 0.008 |
| `m-langchain-perplexity-index` | 0.008 |

Seed a change on that stalk, read the ranked list as “who feels it.”
