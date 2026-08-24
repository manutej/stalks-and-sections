import { RESTRICT_KINDS, nrm2 } from "./algebra.mjs";

export function validateSheaf(raw) {
  const errors = [];
  const warnings = [];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, errors: ["root must be an object"], warnings, stats: null };
  }
  if (!raw.id || typeof raw.id !== "string") errors.push("id: required string");
  if (!raw.title || typeof raw.title !== "string") errors.push("title: required string");
  if (!raw.residualMeaning || typeof raw.residualMeaning !== "string") {
    warnings.push("residualMeaning: missing — a reviewer cannot say what a terracotta edge means");
  }
  if (!Array.isArray(raw.levels) || raw.levels.length < 1) errors.push("levels: required non-empty array");
  else {
    raw.levels.forEach((lv, i) => {
      if (typeof lv?.id !== "number") errors.push(`levels[${i}].id: number required`);
      if (!lv?.label) errors.push(`levels[${i}].label: required`);
    });
  }
  if (!Array.isArray(raw.nodes) || raw.nodes.length < 1) errors.push("nodes: required non-empty array");
  const ids = new Set();
  const byId = new Map();
  (raw.nodes ?? []).forEach((n, i) => {
    if (!n?.id) errors.push(`nodes[${i}].id: required`);
    else if (ids.has(n.id)) errors.push(`nodes: duplicate id ${n.id}`);
    else ids.add(n.id);
    if (!n?.title) errors.push(`nodes[${i}].title: required`);
    if (typeof n?.level !== "number") errors.push(`nodes[${i}].level: number required`);
    if (typeof n?.dim !== "number" || n.dim < 1 || n.dim > 64) {
      errors.push(`nodes[${i}].dim: integer 1–64 required`);
    }
    if (n?.section) {
      if (!Array.isArray(n.section) || n.section.length !== n.dim) {
        errors.push(`nodes[${i}].section: length must equal dim (${n.dim})`);
      } else if (n.section.some((x) => typeof x !== "number" || !Number.isFinite(x))) {
        errors.push(`nodes[${i}].section: finite numbers only`);
      }
    } else {
      warnings.push(`nodes[${i}] ${n?.id}: no section — loader will use zeros, not Gaussians`);
    }
    byId.set(n.id, n);
  });
  if (!Array.isArray(raw.edges)) errors.push("edges: required array");
  (raw.edges ?? []).forEach((e, i) => {
    if (!e?.source || !e?.target) errors.push(`edges[${i}]: source and target required`);
    if (e?.source && !ids.has(e.source)) errors.push(`edges[${i}]: unknown source ${e.source}`);
    if (e?.target && !ids.has(e.target)) errors.push(`edges[${i}]: unknown target ${e.target}`);
    if (e?.restrictKind && !RESTRICT_KINDS.includes(e.restrictKind)) {
      errors.push(`edges[${i}].restrictKind: must be ${RESTRICT_KINDS.join("|")}`);
    }
    const src = byId.get(e?.source);
    const tgt = byId.get(e?.target);
    if (e?.Fsrc) {
      if (!isMatrix(e.Fsrc)) errors.push(`edges[${i}].Fsrc: matrix of numbers`);
      else if (src && e.Fsrc[0] && e.Fsrc[0].length !== src.dim) {
        errors.push(`edges[${i}].Fsrc: columns must equal source.dim (${src.dim})`);
      }
    }
    if (e?.Ftgt) {
      if (!isMatrix(e.Ftgt)) errors.push(`edges[${i}].Ftgt: matrix of numbers`);
      else if (tgt && e.Ftgt[0] && e.Ftgt[0].length !== tgt.dim) {
        errors.push(`edges[${i}].Ftgt: columns must equal target.dim (${tgt.dim})`);
      }
    }
    if (e?.Fsrc && e?.Ftgt && e.Fsrc.length !== e.Ftgt.length) {
      errors.push(`edges[${i}]: Fsrc and Ftgt must share row count (edgeDim)`);
    }
  });
  const sampled = (raw.nodes ?? []).filter((n) => n.section && nrm2(n.section) > 0).length;
  return {
    ok: errors.length === 0,
    errors,
    warnings,
    stats: {
      nodes: raw.nodes?.length ?? 0,
      edges: raw.edges?.length ?? 0,
      levels: raw.levels?.length ?? 0,
      withSection: sampled,
    },
  };
}

function isMatrix(M) {
  return Array.isArray(M) && M.length > 0 && M.every((row) => Array.isArray(row) && row.every((x) => typeof x === "number"));
}

export function formatReport(file, report) {
  const lines = [];
  if (report.ok) {
    const s = report.stats;
    lines.push(`${file}: ok — ${s.nodes} nodes, ${s.edges} edges, ${s.levels} levels, ${s.withSection} with sections`);
  } else {
    lines.push(`${file}: FAILED`);
    for (const e of report.errors) lines.push(`  error  ${e}`);
  }
  for (const w of report.warnings) lines.push(`  warn   ${w}`);
  return lines.join("\n");
}
