"use client";

import { Plus } from "lucide-react";
import type { PageRow } from "@/lib/types";
import { SITE_MAP_TAB_ID } from "@/lib/types";
import { Button } from "@/components/ui/Button";

export function PageTabs({
  pages,
  currentPageId,
  onSelect,
  onAdd,
}: {
  pages: Pick<PageRow, "id" | "name" | "order">[];
  currentPageId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
}) {
  const sorted = [...pages].sort((a, b) => a.order - b.order);
  const mapActive = currentPageId === SITE_MAP_TAB_ID;
  return (
    <div className="flex max-w-full items-center gap-1 overflow-x-auto">
      <button
        type="button"
        onClick={() => onSelect(SITE_MAP_TAB_ID)}
        className={`shrink-0 whitespace-nowrap rounded px-3 py-1.5 text-sm ${
          mapActive
            ? "bg-violet-900 text-white"
            : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
        }`}
      >
        Site map
      </button>
      {sorted.map((p) => {
        const active = p.id === currentPageId;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            className={`whitespace-nowrap rounded px-3 py-1.5 text-sm ${
              active
                ? "bg-stone-900 text-white"
                : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
            }`}
          >
            {p.name}
          </button>
        );
      })}
      <Button
        variant="ghost"
        type="button"
        onClick={onAdd}
        className="!gap-1.5 !px-2 !py-1.5 text-stone-600"
        aria-label="Add page"
      >
        <Plus className="h-4 w-4 shrink-0" aria-hidden />
        <span className="sr-only sm:not-sr-only sm:inline">Add</span>
      </Button>
    </div>
  );
}
