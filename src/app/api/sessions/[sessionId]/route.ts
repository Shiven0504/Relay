import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
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
    include: {
      project: { select: { name: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!chatSession || chatSession.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    projectName: chatSession.project.name,
    previewUrl: chatSession.previewUrl,
    messages: chatSession.messages,
    status: chatSession.status,
  });
}
