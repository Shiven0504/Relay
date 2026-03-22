import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const membership = await db.orgMember.findFirst({
    where: { userId: session.user.id },
    include: {
      org: {
        include: {
          projects: {
            include: {
              sessions: {
                where: { userId: session.user.id, status: "ACTIVE" },
                take: 1,
              },
            },
            orderBy: { updatedAt: "desc" },
          },
        },
      },
    },
  });

  if (!membership) redirect("/org/setup");

  const { org } = membership;
  const isAdmin = membership.role === "ADMIN";

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between md:mb-8">
        <div>
          <h1 className="text-xl font-bold md:text-2xl">{org.name}</h1>
          <p className="text-muted-foreground">
            {org.projects.length} project{org.projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        {isAdmin && (
          <Link href="/projects/new">
            <Button>Add Project</Button>
          </Link>
        )}
      </div>

      {/* Active session banner */}
      {org.projects.some((p) => p.sessions.length > 0) && (
        <div className="mb-6 rounded-xl border border-primary/20 bg-accent p-4">
          <p className="text-sm font-medium text-accent-foreground">
            You have an active session.{" "}
            {org.projects
              .filter((p) => p.sessions.length > 0)
              .map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}/session/${p.sessions[0].id}`}
                  className="underline"
                >
                  Resume on {p.name}
                </Link>
              ))}
          </p>
        </div>
      )}

      {/* Projects grid */}
      {org.projects.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <CardHeader>
            <CardTitle>No projects yet</CardTitle>
            <CardDescription>
              {isAdmin
                ? "Add a GitHub repository to get started."
                : "Ask your team admin to set up a project."}
            </CardDescription>
          </CardHeader>
          {isAdmin && (
            <Link href="/projects/new">
              <Button>Add your first project</Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {org.projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              isAdmin={isAdmin}
              hasActiveSession={project.sessions.length > 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({
  project,
  isAdmin,
  hasActiveSession,
}: {
  project: {
    id: string;
    name: string;
    repoFullName: string;
    setupStatus: string;
  };
  isAdmin: boolean;
  hasActiveSession: boolean;
}) {
  const isReady = project.setupStatus === "READY";
  const statusVariant =
    project.setupStatus === "READY"
      ? "success"
      : project.setupStatus === "FAILED"
        ? "destructive"
        : project.setupStatus === "IN_PROGRESS"
          ? "warning"
          : "muted";

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{project.name}</CardTitle>
          <Badge variant={statusVariant}>
            {project.setupStatus === "READY"
              ? "Ready"
              : project.setupStatus === "IN_PROGRESS"
                ? "Setting up..."
                : project.setupStatus === "FAILED"
                  ? "Setup failed"
                  : "Needs setup"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{project.repoFullName}</p>
      </CardHeader>
      <div className="flex gap-2 pt-2">
        {isReady ? (
          <Link href={`/projects/${project.id}/session/new`} className="flex-1">
            <Button className="w-full" size="sm">
              {hasActiveSession ? "Resume Session" : "Start Session"}
            </Button>
          </Link>
        ) : isAdmin ? (
          <Link href={`/projects/${project.id}/setup`} className="flex-1">
            <Button className="w-full" size="sm" variant="outline">
              Configure
            </Button>
          </Link>
        ) : null}
      </div>
    </Card>
  );
}
