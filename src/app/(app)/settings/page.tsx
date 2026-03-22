import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const membership = await db.orgMember.findFirst({
    where: { userId: session.user.id },
    include: {
      org: {
        include: {
          members: { include: { user: true }, orderBy: { joinedAt: "asc" } },
        },
      },
    },
  });

  if (!membership) redirect("/org/setup");

  const { org } = membership;

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-8">
      <h1 className="mb-4 text-xl font-bold md:mb-6 md:text-2xl">Settings</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
            <CardDescription>{org.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your role:{" "}
              <Badge variant={membership.role === "ADMIN" ? "default" : "muted"}>
                {membership.role}
              </Badge>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              {org.members.length} member{org.members.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {org.members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {m.user.image ? (
                      <img
                        src={m.user.image}
                        alt=""
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                        {m.user.name?.charAt(0) ?? "U"}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">{m.user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.user.email}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={m.role === "ADMIN" ? "default" : "muted"}
                  >
                    {m.role}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
