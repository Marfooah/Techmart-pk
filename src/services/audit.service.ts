import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/rbac/permissions";
import { requireRole } from "@/lib/rbac/permissions";

export async function logAiAction(data: {
  customerId?: string;
  conversationId?: string;
  ticketId?: string;
  toolCalled: string;
  input: unknown;
  output?: unknown;
  confidenceScore?: number;
  success: boolean;
  escalated?: boolean;
  errorMessage?: string;
}) {
  return prisma.aiAuditLog.create({
    data: {
      customerId: data.customerId,
      conversationId: data.conversationId,
      ticketId: data.ticketId,
      toolCalled: data.toolCalled,
      input: JSON.stringify(data.input),
      output: data.output ? JSON.stringify(data.output) : null,
      confidenceScore: data.confidenceScore,
      success: data.success,
      escalated: data.escalated || false,
      errorMessage: data.errorMessage,
    },
  });
}

export async function listAiAuditLogs(
  user: SessionUser,
  options?: { limit?: number; escalatedOnly?: boolean }
) {
  requireRole(user, ["ADMIN"]);
  return prisma.aiAuditLog.findMany({
    where: options?.escalatedOnly ? { escalated: true } : undefined,
    include: {
      customer: { include: { user: { select: { name: true, email: true } } } },
    },
    orderBy: { timestamp: "desc" },
    take: options?.limit || 100,
  });
}
