import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            R
          </div>
          <span className="text-lg font-semibold">Relay</span>
        </div>
        <Link href="/signin">
          <Button variant="outline" size="sm">
            Sign In
          </Button>
        </Link>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <h1 className="max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl">
          Ship changes without
          <br />
          writing code
        </h1>
        <p className="mt-4 max-w-lg text-base text-foreground/60 font-medium md:text-lg">
          Relay lets non-technical team members update your product through a
          simple chat interface. Describe what you want, see it live, and create
          a PR - all without touching a terminal.
        </p>
        <div className="mt-6 flex gap-3 md:mt-8">
          <Link href="/signin">
            <Button size="lg">Get Started</Button>
          </Link>
        </div>

        {/* Feature pills */}
        <div className="mt-10 flex flex-wrap justify-center gap-2 md:mt-16 md:gap-3">
          {[
            "Chat-based editing",
            "Live preview",
            "One-click PRs",
            "Sandboxed environments",
            "No code knowledge needed",
          ].map((feature) => (
            <span
              key={feature}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm"
            >
              {feature}
            </span>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-4 text-center text-sm text-muted-foreground">
        Relay - Built for teams that move fast.
      </footer>
    </div>
  );
}
