"use client";

import { createContext, useContext } from "react";

export type SiteMapActions = {
  patchPage: (pageId: string, patch: { name?: string; description?: string }) => void;
  openPageDesign: (pageId: string) => void;
  removePage: (pageId: string) => void;
};

const SiteMapActionsContext = createContext<SiteMapActions | null>(null);

export function SiteMapActionsProvider({
  value,
  children,
}: {
  value: SiteMapActions;
  children: React.ReactNode;
}) {
  return (
    <SiteMapActionsContext.Provider value={value}>{children}</SiteMapActionsContext.Provider>
  );
}

export function useSiteMapActions(): SiteMapActions | null {
  return useContext(SiteMapActionsContext);
}
