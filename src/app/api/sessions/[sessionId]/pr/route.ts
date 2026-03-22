import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { runCommand, destroySandbox } from "@/lib/e2b";
import { generatePRDescription } from "@/lib/agent";
import { Octokit } from "octokit";
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

  // Get the user's GitHub token
  const account = await db.account.findFirst({
    where: { userId: session.user.id, provider: "github" },
  });
  if (!account?.access_token) {
    return NextResponse.json(
      { error: "GitHub account not connected" },
      { status: 400 }
    );
  }

  try {
    const branchName = `relay/session-${sessionId.slice(0, 8)}`;
    const sandboxId = chatSession.sandboxId;

    // Set up git remote with auth for pushing
    const pushUrl = `https://${account.access_token}@github.com/${chatSession.project.repoFullName}.git`;
    await runCommand(sandboxId, `git remote set-url origin ${pushUrl}`);

    // Create branch, stage, commit, push
    await runCommand(sandboxId, `git checkout -b ${branchName}`);
    await runCommand(sandboxId, `git add -A`);

    const commitResult = await runCommand(
      sandboxId,
      `git diff --cached --quiet || git commit -m "Changes from Relay session"`
    );

    if (commitResult.exitCode !== 0 && !commitResult.stderr.includes("nothing to commit")) {
      throw new Error(`Git commit failed: ${commitResult.stderr}`);
    }

    await runCommand(sandboxId, `git push origin ${branchName}`, {
      timeoutMs: 60_000,
    });

    // Generate PR description from chat history
    const messages = await db.message.findMany({
      where: { sessionId: chatSession.id },
      orderBy: { createdAt: "asc" },
      select: { role: true, content: true },
    });

    const anthropicApiKey = decrypt(chatSession.project.org.anthropicKeyEnc);
    const { title, body } = await generatePRDescription(messages, anthropicApiKey);

    // Create PR via GitHub API
    const octokit = new Octokit({ auth: account.access_token });
    const [owner, repo] = chatSession.project.repoFullName.split("/");

    const { data: pr } = await octokit.rest.pulls.create({
      owner,
      repo,
      title,
      body: `${body}\n\n---\n*Created via [Relay](https://relay.app) by ${session.user.name ?? session.user.email}*`,
      head: branchName,
      base: chatSession.project.defaultBranch,
    });

    // Destroy the sandbox
    await destroySandbox(sandboxId);

    // Update session record
    await db.chatSession.update({
      where: { id: chatSession.id },
      data: {
        status: "ENDED",
        outcome: "PR_CREATED",
        prUrl: pr.html_url,
        branchName,
        endedAt: new Date(),
      },
    });

    return NextResponse.json({ prUrl: pr.html_url });
  } catch (error) {
    console.error("PR creation failed:", error);
    return NextResponse.json(
      {
        error:
          "I couldn't create the pull request. Please try again in a moment.",
      },
      { status: 500 }
    );
  }
}
