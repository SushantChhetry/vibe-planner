"use client";

import { ChevronDown } from "lucide-react";
import { AI_TEMPLATES, BASIC_TEMPLATES } from "@/lib/templates";
import { PremiumBadge } from "@/components/billing/PremiumBadge";
import { Button } from "@/components/ui/Button";

const selectClass =
  "max-w-[10.5rem] shrink-0 truncate rounded-md border border-stone-300 bg-white px-2 py-1.5 text-sm text-stone-800 shadow-sm outline-none focus:ring-2 focus:ring-teal-600 sm:max-w-[13rem]";

function confirmReplace(): boolean {
  return window.confirm(
    "Replace all blocks and connections on this page with this template?"
  );
}

export function TemplateLoader({
  isPro,
  onPremiumClick,
  onApply,
}: {
  isPro: boolean;
  onPremiumClick: () => void;
  onApply: (templateId: string) => void;
}) {
  return (
    <div className="flex flex-nowrap items-center justify-center gap-2 sm:gap-2.5">
      <div className="relative inline-flex shrink-0 items-center">
        <label className="sr-only" htmlFor="basic-template-select">
          Starter template
        </label>
        <select
          id="basic-template-select"
          className={selectClass}
          defaultValue=""
          onChange={(e) => {
            const v = e.target.value;
            e.target.value = "";
            if (!v) return;
            if (confirmReplace()) onApply(v);
          }}
        >
          <option value="">Starter templates…</option>
          {BASIC_TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {isPro ? (
        <div className="relative inline-flex shrink-0 items-center">
          <label className="sr-only" htmlFor="ai-template-select">
            AI blueprint
          </label>
          <select
            id="ai-template-select"
            className={selectClass}
            defaultValue=""
            onChange={(e) => {
              const v = e.target.value;
              e.target.value = "";
              if (!v) return;
              if (confirmReplace()) onApply(v);
            }}
          >
            <option value="">AI blueprints…</option>
            {AI_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="relative inline-flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="outline"
            className="!gap-1.5 !py-1.5 !text-sm whitespace-nowrap shadow-sm"
            onClick={onPremiumClick}
            title="AI blueprints (Premium)"
          >
            <span className="hidden min-[380px]:inline">AI blueprints</span>
            <span className="min-[380px]:hidden">AI</span>
            <PremiumBadge />
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
          </Button>
        </div>
      )}
    </div>
  );
}
