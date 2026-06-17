import { requireUser } from "@/lib/auth/session";
import { listAllTickets } from "@/services/ticket.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { TicketActions } from "@/components/admin/ticket-actions";

export default async function AdminTicketsPage() {
  const user = await requireUser();
  const tickets = await listAllTickets(user);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">All Tickets</h1>
      <div className="space-y-4">
        {tickets.map((ticket) => (
          <Card key={ticket.id}>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-lg">{ticket.ticketNumber}</CardTitle>
                <p className="font-medium">{ticket.subject}</p>
                <p className="text-sm text-muted-foreground">
                  {ticket.customer.user.name} · {ticket.category} · {formatDate(ticket.createdAt)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge>{ticket.status}</Badge>
                <Badge variant={ticket.isEscalated ? "destructive" : "outline"}>
                  {ticket.priority}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm">{ticket.description}</p>
              {ticket.isEscalated && (
                <p className="mb-3 text-sm text-destructive">
                  Escalated: {ticket.escalationReason}
                </p>
              )}
              <TicketActions ticketId={ticket.id} status={ticket.status} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
