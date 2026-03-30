import type { BlockType } from "@/lib/types";

const TYPE_STYLES: Partial<Record<BlockType, string>> = {
  Navbar: "bg-stone-200 text-stone-900",
  Hero: "bg-amber-100 text-amber-950",
  Sidebar: "bg-slate-200 text-slate-900",
  Dashboard: "bg-sky-100 text-sky-950",
  "Data Table": "bg-violet-100 text-violet-950",
  Chart: "bg-fuchsia-100 text-fuchsia-950",
  Form: "bg-emerald-100 text-emerald-950",
  "Auth/Login": "bg-rose-100 text-rose-950",
  Modal: "bg-orange-100 text-orange-950",
  Settings: "bg-zinc-200 text-zinc-900",
  "Cards Grid": "bg-cyan-100 text-cyan-950",
  "Feed/List": "bg-lime-100 text-lime-950",
  "Content section": "bg-teal-100 text-teal-950",
  Footer: "bg-neutral-200 text-neutral-900",
  "Empty State": "bg-gray-100 text-gray-900",
  Custom: "bg-stone-100 text-stone-800",
};

export function Badge({ type }: { type: BlockType }) {
  const cls = TYPE_STYLES[type] ?? "bg-stone-100 text-stone-800";
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${cls}`}>
      {type}
    </span>
  );
}
