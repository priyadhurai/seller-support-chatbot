"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Sparkles, Minus, X, Send, MessageCircle } from "lucide-react";
import { useAIPanel } from "@/lib/ai-panel-context";
import { ApiError, sendChatMessage, SalesSummaryCard as SalesSummaryCardData } from "@/lib/api";
import SalesSummaryCard from "./SalesSummaryCard";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  card?: SalesSummaryCardData | null;
}

const SUGGESTED_PROMPTS = ["Today's sales summary", "Low stock products", "Top selling products", "Recent orders"];
const FOLLOW_UP_CHIPS = ["Show top products", "Any low stock items?", "Any pending returns?"];

export default function AIPanel() {
  const { isOpen, isMinimized, pendingMessage, open, close, toggleMinimize, consumePendingMessage } = useAIPanel();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: "Hi! I'm your AI Seller Assistant. I can help with sales insights, orders, inventory, and more. How can I help today?" },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking, isMinimized]);

  async function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    setThinking(true);
    try {
      const { reply, card } = await sendChatMessage(trimmed);
      setMessages((prev) => [...prev, { role: "assistant", text: reply, card }]);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong. Please try again.";
      setMessages((prev) => [...prev, { role: "assistant", text: `⚠️ ${message}` }]);
    } finally {
      setThinking(false);
    }
  }

  useEffect(() => {
    if (pendingMessage) {
      submit(pendingMessage);
      consumePendingMessage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingMessage]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit(input);
  }

  if (!isOpen) {
    return (
      <button
        onClick={open}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center z-30"
        aria-label="Open AI Seller Assistant"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  const hasUserMessages = messages.some((m) => m.role === "user");

  return (
    <aside className="hidden lg:flex w-[360px] shrink-0 flex-col border-l border-slate-200 bg-white h-screen sticky top-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              AI Seller Assistant
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-xs font-normal text-green-600">Online</span>
            </p>
            <p className="text-xs text-slate-400">Your partner to grow your business</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={toggleMinimize} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400" aria-label="Minimize">
            <Minus size={16} />
          </button>
          <button onClick={close} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400" aria-label="Close">
            <X size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[88%] rounded-lg px-3 py-2 text-sm ${
                    m.role === "user" ? "bg-blue-600 text-white" : "bg-slate-50 border border-slate-200 text-slate-800"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <div className="space-y-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-semibold">
                      <ReactMarkdown>{m.text}</ReactMarkdown>
                      {m.card && <SalesSummaryCard data={m.card} />}
                    </div>
                  ) : (
                    <span className="whitespace-pre-wrap">{m.text}</span>
                  )}
                </div>
              </div>
            ))}

            {!hasUserMessages && !thinking && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => submit(prompt)}
                    className="text-xs font-medium px-2.5 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {hasUserMessages && !thinking && messages[messages.length - 1]?.role === "assistant" && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {FOLLOW_UP_CHIPS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => submit(prompt)}
                    className="text-xs font-medium px-2.5 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {thinking && (
              <div className="flex justify-start">
                <div className="max-w-[88%] rounded-lg px-3 py-2 text-sm bg-slate-50 border border-slate-200 text-slate-400 italic">
                  Thinking…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-slate-200 p-3">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about your store…"
                className="flex-1 text-sm rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={thinking || !input.trim()}
                className="w-9 h-9 shrink-0 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-50"
                aria-label="Send"
              >
                <Send size={15} />
              </button>
            </form>
            <p className="text-[11px] text-slate-400 mt-2 text-center">AI can make mistakes. Please verify important information.</p>
          </div>
        </>
      )}
    </aside>
  );
}
