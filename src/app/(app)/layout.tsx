import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "./components/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  return (
    <div className="flex h-screen flex-col bg-muted/30 md:flex-row">
      <Sidebar user={session.user} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
