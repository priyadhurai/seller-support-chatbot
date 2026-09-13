"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";

interface AIPanelContextValue {
  isOpen: boolean;
  isMinimized: boolean;
  pendingMessage: string | null;
  open: () => void;
  close: () => void;
  toggleMinimize: () => void;
  sendMessage: (text: string) => void;
  consumePendingMessage: () => void;
}

const AIPanelContext = createContext<AIPanelContextValue | undefined>(undefined);

export function AIPanelProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  const open = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const toggleMinimize = useCallback(() => setIsMinimized((m) => !m), []);

  const sendMessage = useCallback((text: string) => {
    setIsOpen(true);
    setIsMinimized(false);
    setPendingMessage(text);
  }, []);

  const consumePendingMessage = useCallback(() => setPendingMessage(null), []);

  return (
    <AIPanelContext.Provider
      value={{ isOpen, isMinimized, pendingMessage, open, close, toggleMinimize, sendMessage, consumePendingMessage }}
    >
      {children}
    </AIPanelContext.Provider>
  );
}

export function useAIPanel() {
  const ctx = useContext(AIPanelContext);
  if (!ctx) throw new Error("useAIPanel must be used within AIPanelProvider");
  return ctx;
}
