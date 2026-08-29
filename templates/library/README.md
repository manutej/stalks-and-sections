# Library ingest templates

Job specs a scraper / `sheaf:ingest` reads. Output is always a SheafGraph that
validates against [`schemas/sheaf-graph.schema.json`](../../schemas/sheaf-graph.schema.json).

| File | What it is |
| --- | --- |
| [`scrape.json`](scrape.json) | Blank LibraryIngest job. Copy, edit, run. |
| [`langchainjs.json`](langchainjs.json) | Worked LCEL job for langchain-ai/langchainjs. |
| [`minimal-sheaf.json`](minimal-sheaf.json) | Smallest valid SheafGraph a scraper may emit. |

```bash
cp templates/library/scrape.json /tmp/my-lib.ingest.json
# edit id, source.root, contract.families, residualMeaning
git clone --depth 1 <source.git> /tmp/my-lib
npm run sheaf:ingest -- --job /tmp/my-lib.ingest.json
npm run sheaf:validate -- docs/examples/my-lib.json
```

Full contract: [`docs/INGEST.md`](../../docs/INGEST.md).

Knowledge-graph triples (not a codebase) still live in [`../kg/`](../kg/).
