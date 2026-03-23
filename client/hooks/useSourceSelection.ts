"use client"

import { create } from "zustand"

interface SourceSelectionStore {
  selectedIds: Set<string>
  toggle: (id: string) => void
  selectAll: (ids: string[]) => void
  clear: () => void
  isSelected: (id: string) => boolean
}

export const useSourceSelection = create<SourceSelectionStore>((set, get) => ({
  selectedIds: new Set(),

  toggle: (id: string) =>
    set((state) => {
      const next = new Set(state.selectedIds)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return { selectedIds: next }
    }),

  selectAll: (ids: string[]) =>
    set({
      selectedIds: new Set(ids),
    }),

  clear: () =>
    set({
      selectedIds: new Set(),
    }),

  isSelected: (id: string) => get().selectedIds.has(id),
}))
