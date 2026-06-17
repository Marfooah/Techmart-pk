import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/rbac/permissions";
import { assertCustomerOwnership, requireRole } from "@/lib/rbac/permissions";

export async function getOrderById(orderId: string, user: SessionUser) {
  const order = await prisma.order.findFirst({
    where: {
      OR: [{ id: orderId }, { externalId: orderId }],
    },
    include: {
      items: { include: { product: true } },
      customer: { include: { user: { select: { name: true, email: true } } } },
      trackingEvents: { orderBy: { occurredAt: "asc" } },
    },
  });
  if (!order) return null;
  if (user.role === "CUSTOMER") assertCustomerOwnership(user, order.customerId);
  return order;
}

export async function getCustomerOrders(customerId: string, user: SessionUser) {
  if (user.role === "CUSTOMER") assertCustomerOwnership(user, customerId);
  return prisma.order.findMany({
    where: { customerId },
    include: { items: { include: { product: true } } },
    orderBy: { orderDate: "desc" },
  });
}

export async function trackOrder(orderId: string, user: SessionUser) {
  const order = await getOrderById(orderId, user);
  if (!order) return null;
  return {
    order: {
      id: order.id,
      externalId: order.externalId,
      status: order.status,
      trackingNumber: order.trackingNumber,
      courierPartner: order.courierPartner,
    },
    events: order.trackingEvents,
  };
}

export async function listAllOrders(user: SessionUser) {
  requireRole(user, ["ADMIN", "AGENT"]);
  return prisma.order.findMany({
    include: {
      customer: { include: { user: { select: { name: true } } } },
      items: true,
    },
    orderBy: { orderDate: "desc" },
    take: 100,
  });
}

export async function getAdminStats() {
  const [
    customers,
    orders,
    returns,
    tickets,
    escalations,
    aiResolutions,
    aiAuditLogs,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.order.count(),
    prisma.returnRequest.count(),
    prisma.ticket.count(),
    prisma.ticket.count({ where: { isEscalated: true } }),
    prisma.ticket.count({ where: { resolutionType: "AI" } }),
    prisma.aiAuditLog.count(),
  ]);
  return { customers, orders, returns, tickets, escalations, aiResolutions, aiAuditLogs };
}
