import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";

export default async function SessionHistoryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const sessions = await db.chatSession.findMany({
    where: { userId: session.user.id },
    include: { project: true },
    orderBy: { startedAt: "desc" },
    take: 50,
  });

  return (
    <div className="p-4 md:p-8">
      <h1 className="mb-4 text-xl font-bold md:mb-6 md:text-2xl">Session History</h1>

      {sessions.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-muted-foreground">
            No sessions yet. Start one from the dashboard.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <Link
              key={s.id}
              href={`/projects/${s.projectId}/session/${s.id}`}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-medium">{s.project.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatRelativeTime(s.startedAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {s.prUrl && (
                  <span className="text-sm text-muted-foreground underline">
                    PR
                  </span>
                )}
                <Badge
                  variant={
                    s.status === "ACTIVE"
                      ? "success"
                      : s.outcome === "PR_CREATED"
                        ? "default"
                        : s.outcome === "DISCARDED"
                          ? "destructive"
                          : "muted"
                  }
                >
                  {s.status === "ACTIVE"
                    ? "Active"
                    : s.status === "PAUSED"
                      ? "Paused"
                      : s.outcome === "PR_CREATED"
                        ? "PR Created"
                        : s.outcome === "COMMITTED"
                          ? "Committed"
                          : s.outcome === "DISCARDED"
                            ? "Discarded"
                            : "Ended"}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
