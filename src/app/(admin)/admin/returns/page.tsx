import { requireUser } from "@/lib/auth/session";
import { listAllReturns } from "@/services/ticket.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatPKR } from "@/lib/utils";
import { ReturnActions } from "@/components/admin/return-actions";

export default async function AdminReturnsPage() {
  const user = await requireUser();
  const returns = await listAllReturns(user);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Return Requests</h1>
      {returns.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No returns found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {returns.map((ret) => (
            <Card key={ret.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {ret.customer.user.name} — Order {ret.order.externalId}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{ret.customer.user.email}</p>
                </div>
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
              <CardContent>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="text-sm">
                    <p><strong>Reason:</strong> {ret.reason}</p>
                    <p><strong>Order total:</strong> {formatPKR(ret.order.total)}</p>
                    <p><strong>Requested:</strong> {formatDate(ret.requestedAt)}</p>
                    {ret.description && <p className="mt-1">{ret.description}</p>}
                  </div>
                  {(ret.status === "PENDING" || ret.status === "UNDER_REVIEW") && (
                    <ReturnActions returnId={ret.id} />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
