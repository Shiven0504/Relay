import { Sandbox } from "e2b";

const PROJECT_DIR = "/home/user/project";

export interface CreateSandboxOpts {
  repoFullName: string;
  defaultBranch: string;
  envVars: string | null;
  startCommand: string;
  githubToken: string;
}

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Creates a sandbox, clones the repo, writes .env, installs deps, and starts the dev server.
 */
export async function createSandbox(opts: CreateSandboxOpts): Promise<{
  sandboxId: string;
  previewUrl: string;
}> {
  const sandbox = await Sandbox.create({ timeoutMs: 10 * 60 * 1000 });

  try {
    // Clone the repo with auth
    const cloneUrl = `https://${opts.githubToken}@github.com/${opts.repoFullName}.git`;
    await sandbox.commands.run(
      `git clone --depth 1 --branch ${opts.defaultBranch} ${cloneUrl} ${PROJECT_DIR}`,
      { timeoutMs: 120_000 }
    );

    // Write .env file if provided
    if (opts.envVars) {
      await sandbox.files.write(`${PROJECT_DIR}/.env`, opts.envVars);
    }

    // Configure git user for later commits
    await sandbox.commands.run(
      `cd ${PROJECT_DIR} && git config user.email "relay@relay.app" && git config user.name "Relay"`,
    );

    // Install dependencies
    await sandbox.commands.run(`cd ${PROJECT_DIR} && npm install`, {
      timeoutMs: 180_000,
    });

    // Start the dev server in the background
    await sandbox.commands.run(`cd ${PROJECT_DIR} && ${opts.startCommand}`, {
      background: true,
    });

    // Give the dev server a moment to start
    await sandbox.commands.run("sleep 5");

    // Detect which port the dev server is using
    const portCheck = await sandbox.commands.run(
      `ss -tlnp 2>/dev/null | grep -oP ':\\K(3000|3001|4173|5173|5174|8080|8000)' | head -1`
    );
    const port = parseInt(portCheck.stdout.trim()) || 3000;

    const host = sandbox.getHost(port);
    const previewUrl = `https://${host}`;

    return { sandboxId: sandbox.sandboxId, previewUrl };
  } catch (error) {
    // If setup fails, kill the sandbox and rethrow
    await sandbox.kill().catch(() => {});
    throw error;
  }
}

/**
 * Runs a shell command inside an existing sandbox.
 */
export async function runCommand(
  sandboxId: string,
  command: string,
  opts?: { cwd?: string; background?: boolean; timeoutMs?: number }
): Promise<CommandResult> {
  const sandbox = await Sandbox.connect(sandboxId);
  const cwd = opts?.cwd ?? PROJECT_DIR;

  const result = await sandbox.commands.run(`cd ${cwd} && ${command}`, {
    background: opts?.background,
    timeoutMs: opts?.timeoutMs ?? 60_000,
  });

  return {
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode ?? 0,
  };
}

/**
 * Destroys a sandbox. Silently succeeds if sandbox is already gone.
 */
export async function destroySandbox(sandboxId: string): Promise<void> {
  try {
    const sandbox = await Sandbox.connect(sandboxId);
    await sandbox.kill();
  } catch {
    // Sandbox may already be dead — that's fine
  }
}

/**
 * Gets a connected sandbox instance for file operations.
 */
export async function getSandbox(sandboxId: string): Promise<Sandbox> {
  return Sandbox.connect(sandboxId);
}
