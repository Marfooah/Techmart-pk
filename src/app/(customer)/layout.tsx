import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AppShell role={user.role === "ADMIN" ? "ADMIN" : "CUSTOMER"} userName={user.name}>
      {children}
    </AppShell>
  );
}
