"use client";

import { approveReturnAction, rejectReturnAction } from "@/actions";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReturnActions({ returnId }: { returnId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    setLoading(true);
    await approveReturnAction(returnId);
    setLoading(false);
    router.refresh();
  }

  async function handleReject() {
    const reason = prompt("Rejection reason:");
    if (!reason) return;
    setLoading(true);
    await rejectReturnAction(returnId, reason);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={handleApprove} disabled={loading}>
        Approve
      </Button>
      <Button size="sm" variant="destructive" onClick={handleReject} disabled={loading}>
        Reject
      </Button>
    </div>
  );
}
