import { getAdminStats } from "@/services/order.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  const cards = [
    { label: "Customers", value: stats.customers, href: "/admin/users" },
    { label: "Orders", value: stats.orders, href: "/dashboard" },
    { label: "Returns", value: stats.returns, href: "/admin/returns" },
    { label: "Tickets", value: stats.tickets, href: "/admin/tickets" },
    { label: "Escalations", value: stats.escalations, href: "/admin/tickets" },
    { label: "AI Resolutions", value: stats.aiResolutions, href: "/admin/tickets" },
    { label: "AI Tool Calls", value: stats.aiAuditLogs, href: "/admin/ai-audit" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">TechMart Pakistan platform overview</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{card.value}</p>
              <Button asChild variant="link" className="mt-1 h-auto p-0">
                <Link href={card.href}>View →</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/admin/returns">Review Returns</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/ai-audit">AI Audit Log</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/users">Manage Users</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
