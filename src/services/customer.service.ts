import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/rbac/permissions";
import { assertCustomerOwnership, requireRole } from "@/lib/rbac/permissions";

export async function getCustomerById(id: string, user: SessionUser) {
  assertCustomerOwnership(user, id);
  return prisma.customer.findUnique({
    where: { id },
    include: { user: { select: { name: true, email: true } } },
  });
}

export async function getCustomerContext(customerId: string) {
  const [customer, orders, tickets, returns] = await Promise.all([
    prisma.customer.findUnique({
      where: { id: customerId },
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.order.findMany({
      where: { customerId },
      orderBy: { orderDate: "desc" },
      take: 5,
      select: { id: true, externalId: true, status: true, orderDate: true, total: true },
    }),
    prisma.ticket.findMany({
      where: { customerId, status: { in: ["OPEN", "IN_PROGRESS", "ESCALATED"] } },
      take: 3,
    }),
    prisma.returnRequest.findMany({
      where: { customerId },
      orderBy: { requestedAt: "desc" },
      take: 2,
    }),
  ]);
  return { customer, orders, tickets, returns };
}

export async function updateCustomerProfile(
  customerId: string,
  user: SessionUser,
  data: { phone?: string; shippingAddress?: string; city?: string; province?: string; postalCode?: string }
) {
  assertCustomerOwnership(user, customerId);
  return prisma.customer.update({ where: { id: customerId }, data });
}

export async function listAllCustomers(user: SessionUser) {
  requireRole(user, ["ADMIN"]);
  return prisma.customer.findMany({
    include: { user: { select: { name: true, email: true, isActive: true } }, _count: { select: { orders: true } } },
    orderBy: { createdAt: "desc" },
  });
}
