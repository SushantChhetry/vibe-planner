"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Plus } from "lucide-react";
import { createProjectAndRedirect } from "@/app/actions/projects";
import { Button } from "@/components/ui/Button";
import { PremiumModal } from "@/components/billing/PremiumModal";
import { PremiumBadge } from "@/components/billing/PremiumBadge";

function NewProjectSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" className="!gap-2" disabled={pending}>
      <Plus className="h-4 w-4 shrink-0" aria-hidden />
      {pending ? "Creating…" : "New project"}
    </Button>
  );
}

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
      <NewProjectSubmit />
    </form>
  );
}
