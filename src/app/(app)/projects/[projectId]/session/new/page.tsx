"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function NewSessionPage() {
  const router = useRouter();
  const params = useParams<{ projectId: string }>();

  useEffect(() => {
    async function createSession() {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: params.projectId }),
      });

      if (res.ok) {
        const { sessionId } = await res.json();
        router.replace(
          `/projects/${params.projectId}/session/${sessionId}`
        );
      } else {
        router.push("/dashboard");
      }
    }

    createSession();
  }, [params.projectId, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
        <p className="text-sm text-muted-foreground">
          Setting up your session...
        </p>
      </div>
    </div>
  );
}
