"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteProject } from "@/app/actions/projects";
import { Button } from "@/components/ui/Button";

export function DeleteProjectButton({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      disabled={isPending}
      className="!gap-1.5 shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700"
      aria-label={`Delete project ${projectName}`}
      onClick={() => {
        if (
          !window.confirm(
            `Delete “${projectName}”? This cannot be undone. All pages and blocks in this project will be removed.`
          )
        ) {
          return;
        }
        startTransition(() => {
          void deleteProject(projectId);
        });
      }}
    >
      <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
      {isPending ? "Deleting…" : "Delete"}
    </Button>
  );
}
