"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { renameProject } from "@/app/actions/projects";
import { Button } from "@/components/ui/Button";

export function RenameProjectButton({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      disabled={isPending}
      className="!gap-1.5 shrink-0 text-stone-700 hover:bg-stone-100 hover:text-stone-900"
      aria-label={`Rename project ${projectName}`}
      onClick={() => {
        const next = window.prompt("Project name", projectName);
        if (next === null) return;
        const trimmed = next.trim();
        if (!trimmed || trimmed === projectName.trim()) return;
        startTransition(async () => {
          const result = await renameProject(projectId, trimmed);
          if (!result.ok) {
            window.alert(result.error);
            return;
          }
          router.refresh();
        });
      }}
    >
      <Pencil className="h-4 w-4 shrink-0" aria-hidden />
      {isPending ? "Renaming…" : "Rename"}
    </Button>
  );
}
