"use client";

import { createContext, useContext } from "react";

export type CanvasHistoryApi = { beforeMutate: () => void };

export const CanvasHistoryContext = createContext<CanvasHistoryApi | null>(null);

export function useCanvasHistoryContext(): CanvasHistoryApi | null {
  return useContext(CanvasHistoryContext);
}
