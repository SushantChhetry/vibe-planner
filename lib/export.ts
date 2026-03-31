import type { ExportFormat, ExportPage, ExportSnapshot, ExportWireItem } from "@/lib/types";

function isExportPageEmpty(page: ExportPage): boolean {
  return page.blocks.length === 0 && page.edges.length === 0;
}

function sortedExportPages(snapshot: ExportSnapshot): ExportPage[] {
  return [...snapshot.pages]
    .sort((a, b) => a.order - b.order)
    .filter((p) => !isExportPageEmpty(p));
}

function sortBlocks<T extends { position_y: number; position_x: number }>(blocks: T[]): T[] {
  return [...blocks].sort((a, b) => {
    if (a.position_y !== b.position_y) return a.position_y - b.position_y;
    return a.position_x - b.position_x;
  });
}

function wireframeRect(w: { frame_x: number; frame_y: number; frame_w: number; frame_h: number }) {
  const x = Math.round(w.frame_x);
  const y = Math.round(w.frame_y);
  const rw = Math.round(w.frame_w);
  const rh = Math.round(w.frame_h);
  return ` @ (${x}, ${y}) ${rw}×${rh}px`;
}

const AI_TAIL =
  "\n\n---\n\n**Instruction for the coding agent:** Implement this structure exactly. " +
  "Preserve page names, block types, navigation flows between blocks, and the intent described in each block. " +
  "Treat each block wireframe as a spatial low-fidelity mock: element positions and box sizes are intentional layout hints. " +
  "Wireframe coordinates use a top-left origin on each page’s artboard; preserve reading order and approximate proportions when building UI. " +
  "Do not invent major screens or flows that are not represented here. Ask only if something is genuinely ambiguous.";

/** Clipboard-friendly block for coding agents (same narrative as export footers). */
export function standaloneAgentInstruction(): string {
  return AI_TAIL.replace(/^\n+/, "").trim();
}

function blockNameLookup(blocks: { id: string; name: string }[]) {
  const m = new Map(blocks.map((b) => [b.id, b.name]));
  return (id: string) => m.get(id) ?? id;
}

function pageIdNameLookup(pages: { id: string; name: string }[]) {
  const m = new Map(pages.map((p) => [p.id, p.name]));
  return (id: string) => m.get(id) ?? id;
}

/** Single-page slice of a snapshot for “this page only” export preview. */
export function filterSnapshotToPage(
  snapshot: ExportSnapshot,
  pageId: string
): ExportSnapshot | null {
  const page = snapshot.pages.find((p) => p.id === pageId);
  if (!page) return null;
  return {
    projectName: snapshot.projectName,
    pages: [page],
    pageNavigation: snapshot.pageNavigation,
  };
}

/** Human-readable wireframe lines for one page (for export drawer excerpt and copy). */
export function buildWireframeExcerptForPage(
  snapshot: ExportSnapshot,
  pageId: string
): string {
  const page = snapshot.pages.find((p) => p.id === pageId);
  if (!page) return "";
  const pageName = pageIdNameLookup(snapshot.pages);
  const lines: string[] = [];
  const blocks = sortBlocks(page.blocks);
  const names = blockNameLookup(page.blocks);
  let any = false;
  for (const b of blocks) {
    if (!b.wireframe.length) continue;
    any = true;
    lines.push(`**${b.name}** (${b.type})`);
    for (const w of b.wireframe) {
      const lbl = w.label ? `: ${w.label}` : "";
      const meta = wireframeMetaNotes(w, pageName);
      lines.push(`  - ${w.element_type}${lbl}${wireframeRect(w)}${meta}`);
    }
    lines.push("");
  }
  if (page.edges.length) {
    lines.push("### In-page navigation");
    lines.push("");
    for (const e of page.edges) {
      const label = e.label ? ` — _${e.label}_` : "";
      lines.push(`- ${names(e.source_block_id)} → ${names(e.target_block_id)}${label}`);
    }
    lines.push("");
  }
  if (!any && !page.edges.length) {
    return "_No wireframe elements or block links on this page._";
  }
  return lines.join("\n").trimEnd();
}

function wireframeMetaNotes(
  w: ExportWireItem,
  pageName: (id: string) => string
): string {
  const m = w.meta;
  if (!m || !Object.keys(m).length) return "";
  const bits: string[] = [];
  if (m.linkPageId) bits.push(`→ page “${pageName(m.linkPageId)}”`);
  if (m.onClickDescription) bits.push(`on click: ${m.onClickDescription}`);
  if (m.inputType) bits.push(`type: ${m.inputType}`);
  if (m.fieldBehavior) bits.push(`behavior: ${m.fieldBehavior}`);
  return bits.length ? ` (${bits.join("; ")})` : "";
}

export function buildExportContent(snapshot: ExportSnapshot, format: ExportFormat): string {
  const pageNav = snapshot.pageNavigation ?? [];
  const pageName = pageIdNameLookup(snapshot.pages);

  if (format === "json") {
    return JSON.stringify(
      {
        project: snapshot.projectName,
        siteNavigation: pageNav.map((e) => ({
          fromPage: pageName(e.source_page_id),
          toPage: pageName(e.target_page_id),
          label: e.label,
        })),
        pages: sortedExportPages(snapshot).map((p) => {
            const sorted = sortBlocks(p.blocks);
            const names = blockNameLookup(p.blocks);
            return {
              name: p.name,
              order: p.order,
              description: p.description,
              blocks: sorted.map((b) => ({
                id: b.id,
                name: b.name,
                type: b.type,
                description: b.description,
                wireframe: b.wireframe,
              })),
              navigationWithinPage: p.edges.map((e) => ({
                from: names(e.source_block_id),
                to: names(e.target_block_id),
                label: e.label,
              })),
            };
          }),
        agentInstruction:
          "Implement this structure exactly. Preserve pages, site-level navigation between pages, block types, in-page navigation, and wireframe layout (positions and sizes) where provided. Do not invent major flows not represented.",
      },
      null,
      2
    );
  }

  if (format === "cursorrules" || format === "claude") {
    const forClaude = format === "claude";
    const lines: string[] = forClaude
      ? [
          "# Project context (from PuMi)",
          "",
          `Project: ${snapshot.projectName}`,
          "",
          "Use this with **Claude** (e.g. save as **CLAUDE.md** at the repo root or paste into project instructions).",
          "",
        ]
      : [
          "# App structure (from PuMi)",
          "",
          `Project: ${snapshot.projectName}`,
          "",
        ];
    if (pageNav.length) {
      lines.push("## Site navigation (pages)", "");
      for (const e of pageNav) {
        const label = e.label ? ` (${e.label})` : "";
        lines.push(`- ${pageName(e.source_page_id)} → ${pageName(e.target_page_id)}${label}`);
      }
      lines.push("");
    }
    for (const page of sortedExportPages(snapshot)) {
      lines.push(`## Page: ${page.name}`);
      if (page.description) {
        lines.push("", page.description, "");
      } else {
        lines.push("");
      }
      const blocks = sortBlocks(page.blocks);
      const names = blockNameLookup(page.blocks);
      for (const b of blocks) {
        lines.push(
          `- [${b.type}] ${b.name}: ${b.description || "(no description)"}`
        );
        if (b.wireframe.length) {
          lines.push("  Wireframe (top-to-bottom read order; positions are approximate):");
          for (const w of b.wireframe) {
            const lbl = w.label ? `: ${w.label}` : "";
            const meta = wireframeMetaNotes(w, pageName);
            lines.push(
              `  - ${w.element_type}${lbl}${wireframeRect(w)}${meta}`
            );
          }
        }
        lines.push("");
      }
      if (page.edges.length) {
        lines.push("Navigation:");
        for (const e of page.edges) {
          const label = e.label ? ` (${e.label})` : "";
          lines.push(`- ${names(e.source_block_id)} → ${names(e.target_block_id)}${label}`);
        }
        lines.push("");
      }
    }
    lines.push("Rules:");
    lines.push(
      "- Follow this structure exactly when generating or modifying code."
    );
    lines.push(
      "- Wireframes use rough bounding boxes on a page-local artboard (top-left origin); preserve relative placement and proportions when building UI."
    );
    lines.push(
      "- Do not add major screens or user flows unless they extend an existing block clearly."
    );
    lines.push("");
    lines.push(AI_TAIL.replace(/^\n+/, "").trim());
    return lines.join("\n");
  }

  const lines: string[] = [
    `# ${snapshot.projectName}`,
    "",
    "Structured plan exported from **PuMi**.",
    "",
  ];
  if (pageNav.length) {
    lines.push("## Site navigation", "");
    for (const e of pageNav) {
      const label = e.label ? ` — _${e.label}_` : "";
      lines.push(
        `- **${pageName(e.source_page_id)}** → **${pageName(e.target_page_id)}**${label}`
      );
    }
    lines.push("");
  }
  for (const page of sortedExportPages(snapshot)) {
    lines.push(`## ${page.name}`);
    if (page.description) {
      lines.push(`_${page.description}_`, "");
    } else {
      lines.push("");
    }
    const blocks = sortBlocks(page.blocks);
    const names = blockNameLookup(page.blocks);
    for (const b of blocks) {
      lines.push(`- **${b.name}** (${b.type})`);
      if (b.description) {
        lines.push(`  - ${b.description}`);
      }
      if (b.wireframe.length) {
        lines.push("  - **Wireframe**");
        for (const w of b.wireframe) {
          const lbl = w.label ? `: ${w.label}` : "";
          const meta = wireframeMetaNotes(w, pageName);
          lines.push(`    - ${w.element_type}${lbl}${wireframeRect(w)}${meta}`);
        }
      }
      lines.push("");
    }
    if (page.edges.length) {
      lines.push("### Navigation");
      lines.push("");
      for (const e of page.edges) {
        const label = e.label ? ` — _${e.label}_` : "";
        lines.push(
          `- ${names(e.source_block_id)} → ${names(e.target_block_id)}${label}`
        );
      }
      lines.push("");
    }
  }
  lines.push(AI_TAIL.replace(/^\n+/, "").trim());
  return lines.join("\n");
}

export function downloadFilename(projectName: string, format: ExportFormat): string {
  const base = projectName.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase() || "pumi-export";
  if (format === "json") return `${base}.json`;
  if (format === "cursorrules") return `.cursorrules`;
  if (format === "claude") return "CLAUDE.md";
  return `${base}-SPEC.md`;
}
