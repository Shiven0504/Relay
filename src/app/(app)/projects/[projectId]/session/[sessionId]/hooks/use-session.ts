"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ── Types ────────────────────────────────────────────────────

export type AgentStatus =
  | { kind: "idle" }
  | { kind: "thinking" }
  | { kind: "making-changes"; summary: string }
  | { kind: "done" }
  | { kind: "error"; message: string };

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface SessionMeta {
  projectName: string;
  elapsedSeconds: number;
  elapsedFormatted: string;
}

export interface PreviewState {
  url: string;
  ready: boolean;
  error: string | null;
  reloadKey: number;
}

export interface UseSessionReturn {
  meta: SessionMeta;
  messages: ChatMessage[];
  status: AgentStatus;
  preview: PreviewState;
  draft: string;
  isCommitting: boolean;

  setDraft: (value: string) => void;
  sendMessage: () => Promise<void>;
  reloadPreview: () => void;
  createPR: () => Promise<void>;
  discardSession: () => Promise<void>;

  inputDisabled: boolean;
  statusLabel: string | null;
}

interface UseSessionOptions {
  sessionId: string;
  onPRCreated?: (prUrl: string) => void;
  onDiscard?: () => void;
}

// ── Status label mapping ─────────────────────────────────────

function getStatusLabel(status: AgentStatus): string | null {
  switch (status.kind) {
    case "thinking":
      return "Thinking...";
    case "making-changes":
      return status.summary || "Making changes...";
    case "done":
      return "Done — check the preview!";
    case "error":
      return "Something went wrong. Try rephrasing your request.";
    case "idle":
      return null;
  }
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// ── Hook ─────────────────────────────────────────────────────

export function useSession(options: UseSessionOptions): UseSessionReturn {
  const { sessionId, onPRCreated, onDiscard } = options;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<AgentStatus>({ kind: "idle" });
  const [draft, setDraft] = useState("");
  const [isCommitting, setIsCommitting] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [preview, setPreview] = useState<PreviewState>({
    url: "",
    ready: false,
    error: null,
    reloadKey: 0,
  });
  const [projectName, setProjectName] = useState("Project");

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load session data on mount
  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setProjectName(data.projectName || "Project");
          if (data.messages) {
            setMessages(
              data.messages.map((m: { id: string; role: string; content: string; createdAt: string }) => ({
                ...m,
                timestamp: new Date(m.createdAt),
              }))
            );
          }
          if (data.previewUrl) {
            setPreview((prev) => ({
              ...prev,
              url: data.previewUrl,
              ready: true,
            }));
          }
        }
      } catch {
        // Session will start fresh
      }
    }
    loadSession();
  }, [sessionId]);

  const isBusy =
    status.kind === "thinking" || status.kind === "making-changes";

  const sendMessage = useCallback(async () => {
    const text = draft.trim();
    if (!text || isBusy) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setDraft("");
    setStatus({ kind: "thinking" });

    try {
      const res = await fetch(`/api/sessions/${sessionId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });

      if (!res.ok) throw new Error("Failed to send message");

      const data = await res.json();

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStatus({ kind: "done" });

      // Update preview if URL changed
      if (data.previewUrl) {
        setPreview((prev) => ({
          ...prev,
          url: data.previewUrl,
          ready: true,
          reloadKey: prev.reloadKey + 1,
        }));
      }

      // Clear "done" status after 3 seconds
      setTimeout(() => setStatus({ kind: "idle" }), 3000);
    } catch {
      setStatus({
        kind: "error",
        message: "Could not process your request. Please try again.",
      });
    }
  }, [draft, isBusy, sessionId]);

  const reloadPreview = useCallback(() => {
    setPreview((prev) => ({ ...prev, reloadKey: prev.reloadKey + 1 }));
  }, []);

  const createPR = useCallback(async () => {
    setIsCommitting(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/pr`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to create PR");
      const data = await res.json();
      onPRCreated?.(data.prUrl);
    } catch {
      setStatus({
        kind: "error",
        message: "Could not create the pull request. Please try again.",
      });
    } finally {
      setIsCommitting(false);
    }
  }, [sessionId, onPRCreated]);

  const discardSession = useCallback(async () => {
    setIsCommitting(true);
    try {
      await fetch(`/api/sessions/${sessionId}/discard`, { method: "POST" });
      onDiscard?.();
    } catch {
      setStatus({ kind: "error", message: "Could not discard the session." });
    } finally {
      setIsCommitting(false);
    }
  }, [sessionId, onDiscard]);

  return {
    meta: {
      projectName,
      elapsedSeconds,
      elapsedFormatted: formatElapsed(elapsedSeconds),
    },
    messages,
    status,
    preview,
    draft,
    isCommitting,
    setDraft,
    sendMessage,
    reloadPreview,
    createPR,
    discardSession,
    inputDisabled: isBusy || !draft.trim(),
    statusLabel: getStatusLabel(status),
  };
}
