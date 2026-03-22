import Anthropic from "@anthropic-ai/sdk";
import { runCommand, getSandbox } from "@/lib/e2b";

const PROJECT_DIR = "/home/user/project";
const MAX_ITERATIONS = 10;

export interface AgentResult {
  rawResponse: string;
  refinedResponse: string;
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

// ── Tool definitions for Claude ──────────────────────────────

const tools: Anthropic.Tool[] = [
  {
    name: "run_shell_command",
    description:
      "Execute a shell command in the project sandbox. The working directory is /home/user/project. Use this to make file changes, install packages, run builds, restart servers, etc.",
    input_schema: {
      type: "object" as const,
      properties: {
        command: {
          type: "string",
          description: "The shell command to run",
        },
        background: {
          type: "boolean",
          description:
            "Run in background (for long-running processes like dev servers). Defaults to false.",
        },
      },
      required: ["command"],
    },
  },
  {
    name: "write_file",
    description:
      "Write content to a file in the project. Path is relative to /home/user/project.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description: "File path relative to /home/user/project",
        },
        content: {
          type: "string",
          description: "The full file content to write",
        },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "read_file",
    description:
      "Read the contents of a file in the project. Path is relative to /home/user/project.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description: "File path relative to /home/user/project",
        },
      },
      required: ["path"],
    },
  },
];

// ── Tool execution ───────────────────────────────────────────

async function executeTool(
  sandboxId: string,
  toolName: string,
  input: Record<string, unknown>
): Promise<string> {
  switch (toolName) {
    case "run_shell_command": {
      const result = await runCommand(sandboxId, input.command as string, {
        background: (input.background as boolean) ?? false,
        timeoutMs: 120_000,
      });
      if (result.exitCode !== 0) {
        return `Command failed (exit code ${result.exitCode}):\nstdout: ${result.stdout}\nstderr: ${result.stderr}`;
      }
      return result.stdout || "(no output)";
    }

    case "write_file": {
      const sandbox = await getSandbox(sandboxId);
      const filePath = `${PROJECT_DIR}/${(input.path as string).replace(/^\//, "")}`;
      await sandbox.files.write(filePath, input.content as string);
      return `File written: ${input.path}`;
    }

    case "read_file": {
      const sandbox = await getSandbox(sandboxId);
      const filePath = `${PROJECT_DIR}/${(input.path as string).replace(/^\//, "")}`;
      const content = await sandbox.files.read(filePath);
      return content;
    }

    default:
      return `Unknown tool: ${toolName}`;
  }
}

// ── Main agent loop ──────────────────────────────────────────

export async function runAgent(opts: {
  sandboxId: string;
  userMessage: string;
  conversationHistory: ConversationMessage[];
  agentContext: string | null;
  anthropicApiKey: string;
}): Promise<AgentResult> {
  const client = new Anthropic({ apiKey: opts.anthropicApiKey });

  const systemPrompt = `You are an AI developer assistant working inside a sandboxed environment for a web project.
You can run shell commands, read files, and write files. The project is located at ${PROJECT_DIR}.

When the user asks for a change:
1. Read the relevant files to understand the current code.
2. Make the necessary changes by writing files.
3. If needed, restart the dev server so changes take effect.
4. Briefly explain what you changed.

Keep your responses concise and technical — they will be refined for the end user.${
    opts.agentContext
      ? `\n\nProject-specific instructions:\n${opts.agentContext}`
      : ""
  }`;

  // Build messages array
  const messages: Anthropic.MessageParam[] = opts.conversationHistory.map(
    (m) => ({
      role: m.role,
      content: m.content,
    })
  );
  messages.push({ role: "user", content: opts.userMessage });

  let currentMessages = messages;
  let finalText = "";

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      tools,
      messages: currentMessages,
    });

    // Extract text blocks and tool use blocks
    const textBlocks = response.content.filter(
      (b): b is Anthropic.TextBlock => b.type === "text"
    );
    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );

    if (textBlocks.length > 0) {
      finalText = textBlocks.map((b) => b.text).join("\n");
    }

    // If no tool calls, we're done
    if (response.stop_reason === "end_turn" || toolUseBlocks.length === 0) {
      break;
    }

    // Execute tool calls and build tool results
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const toolUse of toolUseBlocks) {
      let result: string;
      try {
        result = await executeTool(
          opts.sandboxId,
          toolUse.name,
          toolUse.input as Record<string, unknown>
        );
      } catch (error) {
        result = `Error: ${error instanceof Error ? error.message : String(error)}`;
      }
      toolResults.push({
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: result.slice(0, 10_000), // Truncate long outputs
      });
    }

    // Append assistant response + tool results for next iteration
    currentMessages = [
      ...currentMessages,
      { role: "assistant" as const, content: response.content },
      { role: "user" as const, content: toolResults },
    ];
  }

  // Refine the response for non-technical users
  const refinedResponse = await refineResponse(finalText, opts.anthropicApiKey);

  return { rawResponse: finalText, refinedResponse };
}

// ── Response refinement (Haiku) ──────────────────────────────

export async function refineResponse(
  rawResponse: string,
  anthropicApiKey: string
): Promise<string> {
  if (!rawResponse.trim()) {
    return "I've made the changes — take a look at the preview!";
  }

  const client = new Anthropic({ apiKey: anthropicApiKey });

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    system: `You are a response simplifier for a non-technical user. Rewrite the following developer response into simple, friendly language.

Rules:
- Do NOT mention file names, code, terminal commands, or technical details.
- Focus on what changed and what the user should look at in the preview.
- Keep it to 1-3 sentences.
- Be encouraging and conversational.
- Do NOT use markdown formatting.`,
    messages: [{ role: "user", content: rawResponse }],
  });

  const text = response.content.find(
    (b): b is Anthropic.TextBlock => b.type === "text"
  );
  return text?.text ?? "I've made the changes — check the preview!";
}

// ── PR description generator ─────────────────────────────────

export async function generatePRDescription(
  messages: { role: string; content: string }[],
  anthropicApiKey: string
): Promise<{ title: string; body: string }> {
  const client = new Anthropic({ apiKey: anthropicApiKey });

  const transcript = messages
    .map((m) => `${m.role === "USER" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n\n");

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: `You generate pull request titles and descriptions from chat transcripts.

Respond in exactly this format:
TITLE: <short PR title, max 70 chars>
BODY: <markdown PR description summarizing what was changed and why>

The description should be concise (3-5 bullet points). Do not include the chat transcript.`,
    messages: [{ role: "user", content: transcript }],
  });

  const text = response.content.find(
    (b): b is Anthropic.TextBlock => b.type === "text"
  );
  const raw = text?.text ?? "TITLE: Changes from Relay session\nBODY: Changes made via Relay.";

  const titleMatch = raw.match(/TITLE:\s*(.+)/);
  const bodyMatch = raw.match(/BODY:\s*([\s\S]+)/);

  return {
    title: titleMatch?.[1]?.trim() ?? "Changes from Relay session",
    body: bodyMatch?.[1]?.trim() ?? "Changes made via Relay.",
  };
}
