import { create } from 'zustand';

export type DockPanel = 'inventory' | 'notes' | 'reasoning' | 'results' | 'tasks' | null;
export interface Toast { id: number; text: string; kind: 'clue' | 'info' | 'warn' | 'success' }

interface UIState {
  dock: DockPanel;
  dialogueOpen: boolean;
  docId: string | null;
  message: string | null;
  doorOpen: boolean;
  settingsOpen: boolean;
  hintOpen: boolean;
  hovered: string | null;
  reveal: boolean;
  toasts: Toast[];
  setDock: (p: DockPanel) => void;
  openDock: (p: DockPanel) => void;
  setReveal: (v: boolean) => void;
  openDialogue: (v: boolean) => void;
  openDoc: (id: string | null) => void;
  showMessage: (m: string | null) => void;
  setDoorOpen: (v: boolean) => void;
  setSettings: (v: boolean) => void;
  setHint: (v: boolean) => void;
  setHovered: (id: string | null) => void;
  toast: (text: string, kind?: Toast['kind']) => void;
  closeAll: () => void;
}

let toastId = 0;
export const useUI = create<UIState>((set) => ({
  dock: null, dialogueOpen: false, docId: null, message: null, doorOpen: false,
  settingsOpen: false, hintOpen: false, hovered: null, reveal: false, toasts: [],
  setDock: (dock) => set((s) => ({ dock: s.dock === dock ? null : dock })),
  openDock: (dock) => set({ dock }),
  setReveal: (reveal) => set({ reveal }),
  openDialogue: (dialogueOpen) => set({ dialogueOpen }),
  openDoc: (docId) => set({ docId }),
  showMessage: (message) => set({ message }),
  setDoorOpen: (doorOpen) => set({ doorOpen }),
  setSettings: (settingsOpen) => set({ settingsOpen }),
  setHint: (hintOpen) => set({ hintOpen }),
  setHovered: (hovered) => set({ hovered }),
  toast: (text, kind = 'info') => {
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts.slice(-3), { id, text, kind }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3800);
  },
  closeAll: () => set({ dock: null, dialogueOpen: false, docId: null, message: null }),
}));
