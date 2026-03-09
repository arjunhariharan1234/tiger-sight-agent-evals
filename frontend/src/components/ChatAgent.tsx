"use client";

import { useState, useRef, useEffect } from "react";
import { processQuery } from "@/lib/chat-engine";

interface Message {
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
}

function renderContent(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    // Bold
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={j} className="text-[var(--dark-text)] font-semibold">{part.slice(2, -2)}</strong>;
      }
      return <span key={j}>{part}</span>;
    });

    // List items
    if (line.startsWith("- ")) {
      const listParts = line.replace(/^- /, "").split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={j} className="text-[var(--dark-text)] font-semibold">{part.slice(2, -2)}</strong>;
        }
        return <span key={j}>{part}</span>;
      });
      return <li key={i} className="ml-4 list-disc text-[var(--dark-text-secondary)] text-sm leading-relaxed">{listParts}</li>;
    }
    // Numbered items
    if (/^\d+\.\s/.test(line)) {
      return <div key={i} className="text-[var(--dark-text-secondary)] text-sm leading-relaxed ml-2">{parts}</div>;
    }
    // Table rows (simple)
    if (line.startsWith("|") && line.endsWith("|")) {
      if (line.includes("---|")) return null; // separator
      const cells = line.split("|").filter(c => c.trim());
      return (
        <div key={i} className="grid text-xs text-[var(--dark-text-secondary)] gap-1" style={{ gridTemplateColumns: `repeat(${cells.length}, 1fr)` }}>
          {cells.map((cell, ci) => <span key={ci} className="py-0.5 truncate">{cell.trim()}</span>)}
        </div>
      );
    }
    // Empty line
    if (line.trim() === "") return <div key={i} className="h-2" />;
    // Regular text
    return <p key={i} className="text-sm text-[var(--dark-text-secondary)] leading-relaxed">{parts}</p>;
  });
}

export default function ChatAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm the **Agent Performance Assistant**. Ask me about agent performance, corridors, transporters, or improvement tips.",
      suggestions: ["Performance overview", "Worst performing agent?", "Next best actions", "Corridor analysis"],
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Small delay for natural feel
    setTimeout(() => {
      const response = processQuery(text);
      const botMsg: Message = { role: "assistant", content: response.content, suggestions: response.suggestions };
      setMessages(prev => [...prev, botMsg]);
      setIsLoading(false);
    }, 300);
  };

  const lastSuggestions = messages.filter(m => m.role === "assistant" && m.suggestions).pop()?.suggestions || [];

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-[#ffbe07] to-[#f59e0b] shadow-[0_0_24px_rgba(255,190,7,0.4)] flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
        >
          <svg className="w-6 h-6 text-[#0a0e1a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[420px] h-[600px] bg-[var(--dark-card)] border border-[var(--dark-border)] rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--dark-border-subtle)] bg-[var(--dark-surface)]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ffbe07] to-[#f59e0b] flex items-center justify-center">
                <svg className="w-4 h-4 text-[#0a0e1a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--dark-text)]">Agent Assistant</h3>
                <p className="text-[10px] text-[var(--accent-green)]">Online</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg hover:bg-[var(--dark-card-hover)] transition-colors cursor-pointer">
              <svg className="w-5 h-5 text-[var(--dark-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-[var(--accent-primary-dim)] border border-[var(--accent-primary)]/30 text-[var(--dark-text)]"
                    : "bg-[var(--dark-surface)] border border-[var(--dark-border-subtle)] text-[var(--dark-text-secondary)]"
                }`}>
                  {msg.role === "user" ? (
                    <p className="text-sm">{msg.content}</p>
                  ) : (
                    <div className="flex flex-col gap-0.5">{renderContent(msg.content)}</div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[var(--dark-surface)] border border-[var(--dark-border-subtle)] rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion chips */}
          {lastSuggestions.length > 0 && !isLoading && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {lastSuggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  className="px-3 py-1 rounded-full text-[11px] font-medium bg-[var(--dark-surface)] border border-[var(--dark-border)] text-[var(--dark-text-muted)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-4 py-3 border-t border-[var(--dark-border-subtle)] bg-[var(--dark-surface)]">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                placeholder="Ask about agent performance..."
                className="flex-1 bg-[var(--dark-card)] border border-[var(--dark-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--dark-text)] placeholder:text-[var(--dark-text-muted)] focus:border-[var(--accent-primary)] focus:outline-none transition-colors"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ffbe07] to-[#f59e0b] flex items-center justify-center hover:shadow-[0_0_16px_rgba(255,190,7,0.3)] transition-all disabled:opacity-30 cursor-pointer disabled:cursor-default"
              >
                <svg className="w-5 h-5 text-[#0a0e1a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
