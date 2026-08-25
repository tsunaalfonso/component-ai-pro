const RULES: { match: RegExp; recs: string[] }[] = [
  {
    match: /burn|scorch|char|heat damage|thermal/i,
    recs: [
      "Replace IC immediately.",
      "Check nearby voltage regulators.",
      "Verify power supply.",
      "Inspect PCB traces.",
    ],
  },
  {
    match: /bent pin|bent lead/i,
    recs: [
      "Straighten pins carefully.",
      "Inspect for broken connections.",
      "Test continuity.",
    ],
  },
  {
    match: /broken pin|missing pin|sheared/i,
    recs: [
      "Replace the component — broken or missing pins cannot be reliably repaired.",
      "Inspect the PCB pad and trace for lifted copper.",
      "Reflow neighbouring joints after replacement.",
    ],
  },
  {
    match: /corros|oxidat|rust|green residue/i,
    recs: ["Clean using IPA.", "Dry thoroughly.", "Inspect solder joints."],
  },
  {
    match: /crack|fracture|deform/i,
    recs: ["Replace component.", "Avoid reuse."],
  },
  {
    match: /solder residue|flux|contaminat/i,
    recs: [
      "Clean flux residue with IPA and a soft brush.",
      "Check for solder bridges between adjacent pins.",
      "Re-inspect under magnification after cleaning.",
    ],
  },
  {
    match: /discolor|discolour|label|marking|unreadable/i,
    recs: [
      "Cross-check the part marking against the component database.",
      "Capture a higher-resolution, well-lit image for OCR identification.",
    ],
  },
];

export const HEALTHY_RECS = [
  "No visible issue detected.",
  "Continue electrical testing using a multimeter.",
  "Verify functionality under operating conditions.",
];

export function buildRecommendations(damage: string[], severity?: string | null): string[] {
  const out: string[] = [];
  for (const item of damage) {
    for (const rule of RULES) {
      if (rule.match.test(item)) {
        for (const r of rule.recs) if (!out.includes(r)) out.push(r);
      }
    }
  }
  if (out.length === 0 && (!severity || /none|normal|healthy/i.test(severity))) {
    return HEALTHY_RECS;
  }
  return out;
}
