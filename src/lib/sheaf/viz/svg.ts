import { VIZ_ENCODINGS, VIZ_TOKENS, VIZ_VIEWS } from "./grammar";

const T = VIZ_TOKENS;

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function encodingKeySvg(): string {
  const rows = VIZ_ENCODINGS.map((e, i) => {
    const y = 148 + i * 28;
    return `<text x="36" y="${y}" fill="${T.fgMuted}" font-family="${T.fonts.mono}" font-size="11">${esc(e.channel)}</text>
    <text x="160" y="${y}" fill="${T.fg}" font-family="${T.fonts.sans}" font-size="13">${esc(e.maps)}</text>
    <text x="360" y="${y}" fill="${T.fgSubtle}" font-family="${T.fonts.sans}" font-size="12">${esc(e.rule)}</text>`;
  }).join("\n");
  const views = VIZ_VIEWS.map((v, i) => {
    const x = 36 + i * 178;
    return `<rect x="${x}" y="368" width="168" height="72" rx="10" fill="${T.bgSoft}"/>
    <text x="${x + 14}" y="392" fill="${T.fg}" font-family="${T.fonts.display}" font-size="16">${esc(v.label)}</text>
    <text x="${x + 14}" y="412" fill="${T.fgSubtle}" font-family="${T.fonts.mono}" font-size="10">key ${esc(v.key)}</text>
    <text x="${x + 14}" y="430" fill="${T.fgMuted}" font-family="${T.fonts.sans}" font-size="11">${esc(v.job)}</text>`;
  }).join("\n");
  const swatches = T.levels.map((c, i) => {
    const x = 36 + i * 52;
    return `<rect x="${x}" y="86" width="44" height="22" rx="4" fill="${c}"/>
    <text x="${x}" y="124" fill="${T.fgSubtle}" font-family="${T.fonts.mono}" font-size="10">L${i}</text>`;
  }).join("\n");
  const res = [T.residual.lo, T.residual.mid, T.residual.hi];
  const resMarks = res.map((c, i) => {
    const x = 280 + i * 52;
    return `<rect x="${x}" y="86" width="44" height="22" rx="4" fill="${c}"/>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="760" height="470" viewBox="0 0 760 470">
  <rect width="760" height="470" fill="${T.bg}"/>
  <text x="36" y="36" fill="${T.fg}" font-family="${T.fonts.display}" font-size="22">Stalks &amp; Sections — visual grammar</text>
  <text x="36" y="58" fill="${T.fgMuted}" font-family="${T.fonts.sans}" font-size="13">One channel, one meaning. Still for decks and papers — not a second product.</text>
  ${swatches}
  <text x="36" y="80" fill="${T.fgSubtle}" font-family="${T.fonts.sans}" font-size="10">HIERARCHY</text>
  ${resMarks}
  <text x="280" y="80" fill="${T.fgSubtle}" font-family="${T.fonts.sans}" font-size="10">RESIDUAL · consistent → noisy</text>
  ${rows}
  ${views}
</svg>
`;
}

export function restrictionKindSvg(): string {
  const kinds = [
    { label: "Identity", dash: "", note: "solid — same fibre, no rank drop" },
    { label: "Projection", dash: "6 5", note: "dashed — rank-reducing restriction" },
    { label: "Embed", dash: "2 5", note: "dotted — rank-raising restriction" },
    { label: "Type-aware", dash: "", note: "solid + diamond — named gluing failure" },
  ];
  const rows = kinds.map((k, i) => {
    const y = 80 + i * 48;
    const diamond = k.label === "Type-aware"
      ? `<polygon points="300,${y} 308,${y - 8} 316,${y} 308,${y + 8}" fill="${T.residual.hi}"/>`
      : "";
    return `<text x="36" y="${y + 4}" fill="${T.fg}" font-family="${T.fonts.sans}" font-size="14">${esc(k.label)}</text>
    <line x1="160" y1="${y}" x2="360" y2="${y}" stroke="${k.label === "Type-aware" ? T.residual.hi : T.residual.lo}" stroke-width="2" stroke-dasharray="${k.dash}"/>
    ${diamond}
    <text x="380" y="${y + 4}" fill="${T.fgMuted}" font-family="${T.fonts.sans}" font-size="12">${esc(k.note)}</text>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="280" viewBox="0 0 640 280">
  <rect width="640" height="280" fill="${T.bg}"/>
  <text x="36" y="36" fill="${T.fg}" font-family="${T.fonts.display}" font-size="20">Restriction-kind marks</text>
  <text x="36" y="56" fill="${T.fgMuted}" font-family="${T.fonts.sans}" font-size="12">Second visual variable. Residual stays colour.</text>
  ${rows}
</svg>
`;
}
