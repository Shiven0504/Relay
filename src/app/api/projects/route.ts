import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/crypto";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify user is admin of the org
  const { orgId, name, repoUrl, startCommand, envVars, agentContext, services } =
    await req.json();

  const membership = await db.orgMember.findFirst({
    where: { userId: session.user.id, orgId, role: "ADMIN" },
  });

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Parse repo full name from URL
  const repoFullName = repoUrl
    .replace("https://github.com/", "")
    .replace(/\.git$/, "");

  const project = await db.project.create({
    data: {
      name,
      repoUrl,
      repoFullName,
      startCommand,
      envVarsEnc: envVars ? encrypt(envVars) : null,
      agentContext: agentContext || null,
      services: services || [],
      setupStatus: "IN_PROGRESS",
      orgId,
    },
  });

  // TODO: Trigger E2B template creation in background
  // For now, mark as ready
  await db.project.update({
    where: { id: project.id },
    data: { setupStatus: "READY" },
  });

  return NextResponse.json({ id: project.id });
}
