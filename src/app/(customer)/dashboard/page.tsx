import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getCustomerOrders } from "@/services/order.service";
import { getCustomerTickets, getCustomerReturns } from "@/services/ticket.service";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPKR, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Package, Ticket, RotateCcw, MessageSquare, ArrowRight } from "lucide-react";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user?.customerId) {
    if (user?.role === "ADMIN") redirect("/admin/dashboard");
    return <p>No customer profile found.</p>;
  }

  const [orders, tickets, returns] = await Promise.all([
    getCustomerOrders(user.customerId, user),
    getCustomerTickets(user.customerId, user),
    getCustomerReturns(user.customerId, user),
  ]);

  const openTickets = tickets.filter((t) =>
    ["OPEN", "IN_PROGRESS", "ESCALATED"].includes(t.status)
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description="Manage your orders, returns, and AI support from one place."
      >
        <Button asChild className="bg-gradient-brand hover:opacity-90">
          <Link href="/chat">
            <MessageSquare className="mr-2 h-4 w-4" /> AI Support
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Orders" value={orders.length} icon={Package} />
        <StatCard label="Open Tickets" value={openTickets.length} icon={Ticket} />
        <StatCard label="Returns" value={returns.length} icon={RotateCcw} />
        <StatCard
          label="AI Support"
          value="24/7"
          icon={MessageSquare}
          trend="Gemini-powered assistant"
        />
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/orders">View all <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-xl border bg-muted/30 p-4 transition-colors hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{order.externalId || order.id.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(order.orderDate)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{order.status}</Badge>
                    <span className="font-semibold">{formatPKR(order.total)}</span>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/orders/${order.id}`}>View</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
