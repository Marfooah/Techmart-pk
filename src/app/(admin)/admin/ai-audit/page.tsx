import { requireUser } from "@/lib/auth/session";
import { listAiAuditLogs } from "@/services/audit.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function AiAuditPage() {
  const user = await requireUser();
  const logs = await listAiAuditLogs(user, { limit: 100 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Audit Log</h1>
        <p className="text-muted-foreground">Every AI tool call and decision recorded</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent AI Actions ({logs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 pr-4">Timestamp</th>
                  <th className="pb-2 pr-4">Customer</th>
                  <th className="pb-2 pr-4">Tool</th>
                  <th className="pb-2 pr-4">Success</th>
                  <th className="pb-2 pr-4">Confidence</th>
                  <th className="pb-2">Escalated</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b">
                    <td className="py-2 pr-4 whitespace-nowrap">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="py-2 pr-4">
                      {log.customer?.user.name || "—"}
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs">{log.toolCalled}</td>
                    <td className="py-2 pr-4">
                      <Badge variant={log.success ? "success" : "destructive"}>
                        {log.success ? "Yes" : "No"}
                      </Badge>
                    </td>
                    <td className="py-2 pr-4">
                      {log.confidenceScore
                        ? `${(log.confidenceScore * 100).toFixed(0)}%`
                        : "—"}
                    </td>
                    <td className="py-2">
                      {log.escalated ? (
                        <Badge variant="destructive">Yes</Badge>
                      ) : (
                        "No"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
