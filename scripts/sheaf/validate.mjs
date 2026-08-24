#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { validateSheaf, formatReport } from "./schema.mjs";

const files = process.argv.slice(2).filter((a) => !a.startsWith("-"));
if (files.length === 0) {
  console.error("usage: node scripts/sheaf/validate.mjs <file.json> [...]");
  process.exit(2);
}
let failed = 0;
for (const f of files) {
  const path = resolve(f);
  let raw;
  try {
    raw = JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    console.error(`${f}: not JSON (${err.message})`);
    failed++;
    continue;
  }
  const report = validateSheaf(raw);
  const text = formatReport(f, report);
  if (report.ok) console.log(text);
  else {
    console.error(text);
    failed++;
  }
}
process.exit(failed ? 1 : 0);
