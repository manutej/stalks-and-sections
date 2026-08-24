# Knowledge-graph templates

Fill one of these, then compile:

```bash
npm run sheaf:generate -- --from templates/kg/triples.json --out docs/examples/my-kg.json
npm run sheaf:validate -- docs/examples/my-kg.json
```

Full contract: [`docs/GENERATE.md`](../../docs/GENERATE.md).

| File | Use when |
| --- | --- |
| `triples.json` | You have entities + relations and (ideally) vectors |
| `triples.csv` | Quick topology from a spreadsheet |
| `nodes-edges.json` | Blank sheaf form (copy and rename) |
