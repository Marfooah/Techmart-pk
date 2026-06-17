import { getCurrentUser } from "@/lib/auth/session";
import { getCustomerTickets } from "@/services/ticket.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function TicketsPage() {
  const user = await getCurrentUser();
  if (!user?.customerId) return <p>Customer profile required.</p>;

  const tickets = await getCustomerTickets(user.customerId, user);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Support Tickets</h1>
        <Button asChild>
          <Link href="/tickets/new">New Ticket</Link>
        </Button>
      </div>

      {tickets.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No tickets yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">{ticket.ticketNumber}</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline">{ticket.status}</Badge>
                  <Badge variant={ticket.priority === "HIGH" ? "destructive" : "secondary"}>
                    {ticket.priority}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{ticket.subject}</p>
                <p className="text-sm text-muted-foreground">
                  {ticket.category} · {formatDate(ticket.createdAt)}
                </p>
                <Button asChild variant="ghost" size="sm" className="mt-2">
                  <Link href={`/tickets/${ticket.id}`}>View</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
