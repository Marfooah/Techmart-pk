import { getCurrentUser } from "@/lib/auth/session";
import { getCustomerReturns } from "@/services/ticket.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ReturnsPage() {
  const user = await getCurrentUser();
  if (!user?.customerId) return <p>Customer profile required.</p>;

  const returns = await getCustomerReturns(user.customerId, user);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Returns</h1>
        <Button asChild>
          <Link href="/returns/new">New Return</Link>
        </Button>
      </div>

      {returns.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No return requests yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {returns.map((ret) => (
            <Card key={ret.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Order {ret.order.externalId}</CardTitle>
                <Badge
                  variant={
                    ret.status === "APPROVED"
                      ? "success"
                      : ret.status === "REJECTED"
                        ? "destructive"
                        : "warning"
                  }
                >
                  {ret.status}
                </Badge>
              </CardHeader>
              <CardContent className="text-sm">
                <p><span className="text-muted-foreground">Reason:</span> {ret.reason}</p>
                <p><span className="text-muted-foreground">Requested:</span> {formatDate(ret.requestedAt)}</p>
                {ret.description && <p className="mt-2">{ret.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
