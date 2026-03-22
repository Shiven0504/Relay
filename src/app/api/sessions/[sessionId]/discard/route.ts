import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { destroySandbox } from "@/lib/e2b";
import { NextResponse } from "next/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const chatSession = await db.chatSession.findUnique({
    where: { id: sessionId },
  });

  if (!chatSession || chatSession.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Destroy the E2B sandbox (silently handle if already gone)
  if (chatSession.sandboxId) {
    await destroySandbox(chatSession.sandboxId);
  }

  await db.chatSession.update({
    where: { id: chatSession.id },
    data: {
      status: "ENDED",
      outcome: "DISCARDED",
      endedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
