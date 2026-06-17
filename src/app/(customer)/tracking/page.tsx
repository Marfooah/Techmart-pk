"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type TrackingResult = {
  order: {
    id: string;
    externalId: string | null;
    status: string;
    trackingNumber: string | null;
    courierPartner: string | null;
  };
  events: {
    id: string;
    status: string;
    location: string | null;
    description: string | null;
    occurredAt: string;
  }[];
};

export default function TrackingPage() {
  const [orderId, setOrderId] = useState("");
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/track`);
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Order not found");
      return;
    }
    setResult(data);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Track Order</h1>
      <Card>
        <CardHeader>
          <CardTitle>Enter Order ID or Tracking Number</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTrack} className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="orderId" className="sr-only">
                Order ID
              </Label>
              <Input
                id="orderId"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="PK-ORD-10001 or tracking number"
                required
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "..." : "Track"}
            </Button>
          </form>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.order.externalId}
              <Badge>{result.order.status}</Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {result.order.courierPartner} · {result.order.trackingNumber}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {result.events.map((event) => (
                <div key={event.id} className="border-l-2 border-primary pl-4">
                  <p className="font-medium">{event.status}</p>
                  <p className="text-sm text-muted-foreground">
                    {event.location} · {new Date(event.occurredAt).toLocaleString()}
                  </p>
                  {event.description && <p className="text-sm">{event.description}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
