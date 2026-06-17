"use client";

import { updateTicketAction } from "@/actions";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function TicketActions({
  ticketId,
  status,
}: {
  ticketId: string;
  status: string;
}) {
  const router = useRouter();

  async function updateStatus(newStatus: string) {
    await updateTicketAction(ticketId, { status: newStatus });
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "IN_PROGRESS" && (
        <Button size="sm" variant="outline" onClick={() => updateStatus("IN_PROGRESS")}>
          In Progress
        </Button>
      )}
      {status !== "RESOLVED" && (
        <Button size="sm" onClick={() => updateStatus("RESOLVED")}>
          Resolve
        </Button>
      )}
      {status !== "CLOSED" && (
        <Button size="sm" variant="secondary" onClick={() => updateStatus("CLOSED")}>
          Close
        </Button>
      )}
    </div>
  );
}
