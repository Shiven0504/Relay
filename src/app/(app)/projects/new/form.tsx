"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const SERVICES = [
  { id: "postgres", label: "PostgreSQL" },
  { id: "redis", label: "Redis" },
  { id: "mysql", label: "MySQL" },
];

export function ProjectSetupForm({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  function toggleService(id: string) {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orgId,
        name: fd.get("name"),
        repoUrl: fd.get("repoUrl"),
        startCommand: fd.get("startCommand"),
        envVars: fd.get("envVars"),
        agentContext: fd.get("agentContext"),
        services: selectedServices,
      }),
    });

    if (res.ok) {
      router.push("/dashboard");
    } else {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Project name
        </label>
        <Input id="name" name="name" placeholder="Web App" required />
      </div>

      <div className="space-y-2">
        <label htmlFor="repoUrl" className="text-sm font-medium">
          GitHub repository URL
        </label>
        <Input
          id="repoUrl"
          name="repoUrl"
          placeholder="https://github.com/acme/web-app"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="startCommand" className="text-sm font-medium">
          Start command
        </label>
        <Input
          id="startCommand"
          name="startCommand"
          placeholder="npm run dev"
          required
        />
        <p className="text-xs text-muted-foreground">
          The command to boot the project in the sandbox.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="envVars" className="text-sm font-medium">
          Environment variables
        </label>
        <Textarea
          id="envVars"
          name="envVars"
          placeholder={"DATABASE_URL=postgresql://...\nAPI_KEY=..."}
          rows={5}
          className="font-mono text-xs"
        />
        <p className="text-xs text-muted-foreground">
          Paste your .env file contents. These are encrypted and stored securely.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="agentContext" className="text-sm font-medium">
          Agent context <span className="text-muted-foreground">(optional)</span>
        </label>
        <Textarea
          id="agentContext"
          name="agentContext"
          placeholder="This is a Next.js 14 app with App Router. The main API routes are in /src/app/api/. Use conventional commits..."
          rows={4}
        />
        <p className="text-xs text-muted-foreground">
          Extra instructions for the AI about your project&apos;s architecture,
          conventions, or areas to avoid.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Required services</label>
        <div className="flex gap-3">
          {SERVICES.map((svc) => (
            <button
              key={svc.id}
              type="button"
              onClick={() => toggleService(svc.id)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                selectedServices.includes(svc.id)
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border hover:bg-muted"
              }`}
            >
              {svc.label}
            </button>
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Setting up sandbox..." : "Setup Project"}
      </Button>
    </form>
  );
}
