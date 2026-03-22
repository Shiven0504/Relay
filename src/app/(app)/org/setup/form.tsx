"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function OrgSetupForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/orgs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        anthropicKey: formData.get("anthropicKey"),
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
          Organization name
        </label>
        <Input
          id="name"
          name="name"
          placeholder="Acme Inc."
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="anthropicKey" className="text-sm font-medium">
          Anthropic API key
        </label>
        <Input
          id="anthropicKey"
          name="anthropicKey"
          type="password"
          placeholder="sk-ant-..."
          required
        />
        <p className="text-xs text-muted-foreground">
          This key powers all AI sessions in your org. It&apos;s encrypted and stored securely.
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating..." : "Create Organization"}
      </Button>
    </form>
  );
}
