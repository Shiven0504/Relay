import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { runAgent } from "@/lib/agent";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const chatSession = await db.chatSession.findUnique({
    where: { id: sessionId },
    include: { project: { include: { org: true } } },
  });

  if (!chatSession || chatSession.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!chatSession.sandboxId) {
    return NextResponse.json(
      { error: "Session has no active sandbox" },
      { status: 400 }
    );
  }

  const { content } = await req.json();

  // Save user message
  await db.message.create({
    data: {
      role: "USER",
      content,
      sessionId: chatSession.id,
    },
  });

  // Update last active
  await db.chatSession.update({
    where: { id: chatSession.id },
    data: { lastActiveAt: new Date() },
  });

  try {
    // Decrypt the org's Anthropic API key
    const anthropicApiKey = decrypt(chatSession.project.org.anthropicKeyEnc);

    // Load conversation history
    const history = await db.message.findMany({
      where: { sessionId: chatSession.id },
      orderBy: { createdAt: "asc" },
      select: { role: true, content: true },
    });

    // Filter out the message we just saved (it'll be passed as userMessage)
    const conversationHistory = history
      .slice(0, -1)
      .map((m) => ({
        role: m.role.toLowerCase() as "user" | "assistant",
        content: m.content,
      }));

    // Run the agent
    const result = await runAgent({
      sandboxId: chatSession.sandboxId,
      userMessage: content,
      conversationHistory,
      agentContext: chatSession.project.agentContext,
      anthropicApiKey,
    });

    const reply = result.refinedResponse;

    // Save assistant message
    await db.message.create({
      data: {
        role: "ASSISTANT",
        content: reply,
        sessionId: chatSession.id,
      },
    });

    return NextResponse.json({
      reply,
      previewUrl: chatSession.previewUrl,
    });
  } catch (error) {
    console.error("Agent error:", error);

    const errorReply =
      "I ran into a problem making that change. Could you try describing what you want differently?";

    // Save the error as an assistant message
    await db.message.create({
      data: {
        role: "ASSISTANT",
        content: errorReply,
        sessionId: chatSession.id,
      },
    });

    return NextResponse.json({
      reply: errorReply,
      previewUrl: chatSession.previewUrl,
    });
  }
}
