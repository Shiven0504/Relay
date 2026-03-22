import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { createSandbox } from "@/lib/e2b";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await req.json();

  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { org: { include: { members: true } } },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Verify user is a member of the org
  const isMember = project.org.members.some(
    (m) => m.userId === session.user!.id
  );
  if (!isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (project.setupStatus !== "READY") {
    return NextResponse.json(
      { error: "Project setup is not complete" },
      { status: 400 }
    );
  }

  // Get the user's GitHub access token
  const account = await db.account.findFirst({
    where: { userId: session.user.id, provider: "github" },
  });
  if (!account?.access_token) {
    return NextResponse.json(
      { error: "GitHub account not connected. Please sign in with GitHub." },
      { status: 400 }
    );
  }

  try {
    // Decrypt env vars if present
    const envVars = project.envVarsEnc ? decrypt(project.envVarsEnc) : null;

    // Spin up E2B sandbox
    const { sandboxId, previewUrl } = await createSandbox({
      repoFullName: project.repoFullName,
      defaultBranch: project.defaultBranch,
      envVars,
      startCommand: project.startCommand,
      githubToken: account.access_token,
    });

    const chatSession = await db.chatSession.create({
      data: {
        userId: session.user.id,
        projectId,
        sandboxId,
        previewUrl,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({ sessionId: chatSession.id });
  } catch (error) {
    console.error("Failed to create sandbox:", error);
    return NextResponse.json(
      {
        error:
          "We're having trouble setting up the environment. Please try again or contact your team's admin.",
      },
      { status: 500 }
    );
  }
}
