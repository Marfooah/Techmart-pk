import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getTicketById } from "@/services/ticket.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const ticket = await getTicketById(id, user);
  if (!ticket) notFound();

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/tickets">← Back</Link>
      </Button>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold">{ticket.ticketNumber}</h1>
        <Badge>{ticket.status}</Badge>
        <Badge variant="outline">{ticket.priority}</Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{ticket.subject}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Category:</span> {ticket.category}</p>
          <p><span className="text-muted-foreground">Created:</span> {formatDate(ticket.createdAt)}</p>
          <p><span className="text-muted-foreground">Sentiment:</span> {ticket.sentiment}</p>
          {ticket.isEscalated && (
            <p className="text-destructive">Escalated: {ticket.escalationReason}</p>
          )}
          <p className="mt-4">{ticket.description}</p>
        </CardContent>
      </Card>
    </div>
  );
}
