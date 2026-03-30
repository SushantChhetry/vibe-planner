"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { createProjectAndRedirect } from "@/app/actions/projects";
import { Button } from "@/components/ui/Button";
import { PremiumModal } from "@/components/billing/PremiumModal";
import { PremiumBadge } from "@/components/billing/PremiumBadge";

export function NewProjectButton({
  isPro,
  projectCount,
}: {
  isPro: boolean;
  projectCount: number;
}) {
  const [premiumOpen, setPremiumOpen] = useState(false);
  const locked = !isPro && projectCount >= 1;

  if (locked) {
    return (
      <>
        <Button
          type="button"
          variant="primary"
          className="!gap-2 ring-2 ring-amber-200/60 ring-offset-2 ring-offset-[var(--background)]"
          onClick={() => setPremiumOpen(true)}
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden />
          New project
          <PremiumBadge className="ml-0.5" />
        </Button>
        <PremiumModal
          open={premiumOpen}
          onClose={() => setPremiumOpen(false)}
          title="Multiple projects are a Premium feature"
          description="Upgrade for unlimited projects, full AI blueprints, team tools, advanced exports, and canvas themes."
        />
      </>
    );
  }

  return (
    <form action={createProjectAndRedirect}>
      <Button type="submit" variant="primary" className="!gap-2">
        <Plus className="h-4 w-4 shrink-0" aria-hidden />
        New project
      </Button>
    </form>
  );
}
