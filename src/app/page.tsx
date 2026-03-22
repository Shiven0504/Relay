import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <svg viewBox="0 0 512 512" className="h-8 w-8">
            <rect width="512" height="512" rx="108" fill="#2563eb"/>
            <rect x="100" y="130" width="200" height="160" rx="28" fill="white" opacity="0.9"/>
            <polygon points="160,290 180,340 220,290" fill="white" opacity="0.9"/>
            <g fill="none" stroke="white" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round">
              <path d="M280 256 L380 256"/>
              <path d="M345 220 L385 256 L345 292"/>
            </g>
            <rect x="140" y="175" width="80" height="14" rx="7" fill="#2563eb"/>
            <rect x="140" y="205" width="120" height="14" rx="7" fill="#2563eb"/>
            <rect x="140" y="235" width="60" height="14" rx="7" fill="#2563eb"/>
          </svg>
          <span className="text-lg font-semibold">Relay</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/signin">
            <Button variant="outline" size="sm" className="hover:bg-muted">
              Sign In
            </Button>
          </Link>
        </div>
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
