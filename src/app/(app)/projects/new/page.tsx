import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ProjectSetupForm } from "./form";

export default async function NewProjectPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const membership = await db.orgMember.findFirst({
    where: { userId: session.user.id, role: "ADMIN" },
  });

  if (!membership) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Add a project</CardTitle>
          <CardDescription>
            Configure a GitHub repository so your team can start making changes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectSetupForm orgId={membership.orgId} />
        </CardContent>
      </Card>
    </div>
  );
}
