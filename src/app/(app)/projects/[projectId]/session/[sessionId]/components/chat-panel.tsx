"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage, AgentStatus } from "../hooks/use-session";

interface ChatPanelProps {
  messages: ChatMessage[];
  status: AgentStatus;
  statusLabel: string | null;
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  inputDisabled: boolean;
}

export function ChatPanel({
  messages,
  status,
  statusLabel,
  draft,
  onDraftChange,
  onSend,
  inputDisabled,
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length, statusLabel]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <p className="text-lg font-medium text-foreground">
                What would you like to change?
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Describe what you want in plain language. For example:
                <br />
                &quot;Change the header color to blue&quot;
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Status indicator */}
        {statusLabel && <StatusIndicator status={status} label={statusLabel} />}
      </div>

      {/* Input */}
      <div className="border-t border-border p-4">
        <div className="flex gap-2">
          <textarea
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you'd like to change..."
            rows={1}
            className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            onClick={onSend}
            disabled={inputDisabled}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted text-foreground rounded-bl-md"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

function StatusIndicator({
  status,
  label,
}: {
  status: AgentStatus;
  label: string;
}) {
  const isAnimated =
    status.kind === "thinking" || status.kind === "making-changes";
  const isError = status.kind === "error";

  return (
    <div className="flex justify-start">
      <div
        className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
          isError
            ? "bg-red-50 text-red-700"
            : "bg-accent text-accent-foreground"
        }`}
      >
        {isAnimated && (
          <span className="flex gap-0.5">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:300ms]" />
          </span>
        )}
        {label}
      </div>
    </div>
  );
}

function SendIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 2L11 13" />
      <path d="M22 2L15 22L11 13L2 9L22 2Z" />
    </svg>
  );
}
