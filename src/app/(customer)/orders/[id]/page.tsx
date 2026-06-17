import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrderById } from "@/services/order.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPKR, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const order = await getOrderById(id, user);
  if (!order) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/orders">← Back</Link>
        </Button>
        <h1 className="text-3xl font-bold">Order {order.externalId}</h1>
        <Badge>{order.status}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Date:</span> {formatDate(order.orderDate)}</p>
            <p><span className="text-muted-foreground">Payment:</span> {order.paymentMethod}</p>
            <p><span className="text-muted-foreground">Courier:</span> {order.courierPartner}</p>
            <p><span className="text-muted-foreground">Tracking:</span> {order.trackingNumber || "N/A"}</p>
            <p><span className="text-muted-foreground">Total:</span> {formatPKR(order.total)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shipping Address</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>{order.shippingAddress}</p>
            <p>{order.city}, {order.province} {order.postalCode}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between border-b pb-2">
                <div>
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <p>{formatPKR(item.totalPrice)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tracking Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {order.trackingEvents.length === 0 ? (
            <p className="text-muted-foreground">No tracking events yet.</p>
          ) : (
            <div className="space-y-4">
              {order.trackingEvents.map((event) => (
                <div key={event.id} className="flex gap-4 border-l-2 border-primary pl-4">
                  <div>
                    <p className="font-medium">{event.status}</p>
                    <p className="text-sm text-muted-foreground">
                      {event.location} · {formatDate(event.occurredAt)}
                    </p>
                    {event.description && (
                      <p className="text-sm">{event.description}</p>
                    )}
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
