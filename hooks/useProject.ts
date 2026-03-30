"use client";

import { useCallback, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase";
import type { SaveStatus } from "@/components/ui/TopBar";

export function useDebouncedProjectRename(
  projectId: string,
  name: string,
  initialName: string,
  onSaveStatus: (status: SaveStatus) => void
) {
  const lastPersisted = useRef(initialName);
  const nameRef = useRef(name);
  const statusRef = useRef(onSaveStatus);
  statusRef.current = onSaveStatus;
  nameRef.current = name;

  useEffect(() => {
    lastPersisted.current = initialName;
  }, [initialName, projectId]);

  const persist = useCallback(
    async (nameToSave: string) => {
      if (!projectId || nameToSave === lastPersisted.current) return;

      statusRef.current("saving");
      const supabase = createClient();
      const { data, error } = await supabase
        .from("projects")
        .update({ name: nameToSave, updated_at: new Date().toISOString() })
        .eq("id", projectId)
        .select("id");

      if (error || !data?.length) {
        statusRef.current("error");
        return;
      }

      lastPersisted.current = nameToSave;
      statusRef.current("saved");
      window.setTimeout(() => statusRef.current("idle"), 2000);
    },
    [projectId]
  );

  useEffect(() => {
    if (name === lastPersisted.current) return;

    const t = window.setTimeout(() => {
      void persist(name);
    }, 800);

    return () => window.clearTimeout(t);
  }, [name, persist]);

  return { flushProjectName: () => void persist(nameRef.current) };
}
