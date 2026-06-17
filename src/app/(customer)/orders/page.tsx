import { getCurrentUser } from "@/lib/auth/session";
import { getCustomerOrders } from "@/services/order.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPKR, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user?.customerId) return <p>Customer profile required.</p>;

  const orders = await getCustomerOrders(user.customerId, user);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Orders</h1>
      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No orders found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">
                  {order.externalId || order.id}
                </CardTitle>
                <Badge variant="outline">{order.status}</Badge>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="text-sm text-muted-foreground">
                    <p>{formatDate(order.orderDate)} · {order.city}, {order.province}</p>
                    <p>{order.items.length} item(s) · {order.courierPartner}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold">{formatPKR(order.total)}</span>
                    <Button asChild size="sm">
                      <Link href={`/orders/${order.id}`}>Details</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
