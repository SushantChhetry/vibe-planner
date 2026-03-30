"use client";

import { createContext, useContext } from "react";

export type WireframeModeContextValue = {
  openWireframe: (blockId: string) => void;
};

export const WireframeModeContext = createContext<WireframeModeContextValue | null>(null);

export function useWireframeMode() {
  return useContext(WireframeModeContext);
}
