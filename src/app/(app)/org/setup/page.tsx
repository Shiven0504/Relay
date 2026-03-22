import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { OrgSetupForm } from "./form";

export default async function OrgSetupPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Create your organization</CardTitle>
          <CardDescription>
            Set up your team workspace to start collaborating on code changes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrgSetupForm />
        </CardContent>
      </Card>
    </div>
  );
}
