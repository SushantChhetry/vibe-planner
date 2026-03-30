import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Project } from "@/lib/types";
import { DeleteProjectButton } from "@/components/dashboard/DeleteProjectButton";
import { RenameProjectButton } from "@/components/dashboard/RenameProjectButton";

export function ProjectCard({
  project,
  pageCount,
  blockCount,
}: {
  project: Pick<Project, "id" | "name" | "updated_at">;
  pageCount: number;
  blockCount: number;
}) {
  const updated = new Date(project.updated_at).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="flex overflow-hidden rounded-lg border border-stone-200 bg-white transition hover:border-stone-300 hover:shadow-sm">
      <Link
        href={`/canvas/${project.id}`}
        className="flex min-w-0 flex-1 items-start gap-3 p-4 transition hover:bg-stone-50/80"
      >
        <div className="min-w-0 flex-1">
          <h2 className="font-medium text-stone-900">{project.name}</h2>
          <p className="mt-1 text-sm text-stone-500">Last edited {updated}</p>
          <p className="mt-3 text-sm text-stone-600">
            {pageCount} {pageCount === 1 ? "page" : "pages"} · {blockCount}{" "}
            {blockCount === 1 ? "block" : "blocks"}
          </p>
        </div>
        <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-stone-400" aria-hidden />
      </Link>
      <div className="flex shrink-0 flex-col items-stretch gap-1 border-l border-stone-100 p-2">
        <DeleteProjectButton projectId={project.id} projectName={project.name} />
        <RenameProjectButton projectId={project.id} projectName={project.name} />
      </div>
    </div>
  );
}
