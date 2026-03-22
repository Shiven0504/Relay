"use client";

import { useRouter, useParams } from "next/navigation";
import { useSession } from "./hooks/use-session";
import { SessionLayout } from "./components/session-layout";
import { TopBar } from "./components/top-bar";
import { ChatPanel } from "./components/chat-panel";
import { PreviewPanel } from "./components/preview-panel";

export default function SessionPage() {
  const router = useRouter();
  const params = useParams<{ projectId: string; sessionId: string }>();

  const session = useSession({
    sessionId: params.sessionId,
    onPRCreated: () => router.push("/dashboard"),
    onDiscard: () => router.push("/dashboard"),
  });

  return (
    <SessionLayout
      topBar={
        <TopBar
          projectName={session.meta.projectName}
          elapsedFormatted={session.meta.elapsedFormatted}
          onCreatePR={session.createPR}
          onDiscard={session.discardSession}
          isCommitting={session.isCommitting}
        />
      }
      chatPanel={
        <ChatPanel
          messages={session.messages}
          status={session.status}
          statusLabel={session.statusLabel}
          draft={session.draft}
          onDraftChange={session.setDraft}
          onSend={session.sendMessage}
          inputDisabled={session.inputDisabled}
        />
      }
      previewPanel={
        <PreviewPanel
          url={session.preview.url}
          ready={session.preview.ready}
          error={session.preview.error}
          reloadKey={session.preview.reloadKey}
          onReload={session.reloadPreview}
        />
      }
    />
  );
}
