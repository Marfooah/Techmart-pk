import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/rbac/permissions";
import { assertCustomerOwnership, requireRole } from "@/lib/rbac/permissions";
import { generateTicketNumber } from "@/lib/utils";
import type { ReturnReason, TicketCategory } from "@prisma/client";

export async function createReturnRequest(
  customerId: string,
  user: SessionUser,
  data: { orderId: string; reason: ReturnReason; description?: string }
) {
  assertCustomerOwnership(user, customerId);

  const order = await prisma.order.findFirst({
    where: {
      OR: [{ id: data.orderId }, { externalId: data.orderId }],
      customerId,
    },
  });
  if (!order) throw new Error("Order not found or access denied");

  if (!["DELIVERED", "SHIPPED", "IN_TRANSIT"].includes(order.status)) {
    throw new Error("Order is not eligible for return");
  }

  return prisma.returnRequest.create({
    data: {
      orderId: order.id,
      customerId,
      reason: data.reason,
      description: data.description,
      status: "PENDING",
    },
  });
}

export async function getCustomerReturns(customerId: string, user: SessionUser) {
  assertCustomerOwnership(user, customerId);
  return prisma.returnRequest.findMany({
    where: { customerId },
    include: { order: { select: { externalId: true, orderDate: true } } },
    orderBy: { requestedAt: "desc" },
  });
}

export async function listAllReturns(user: SessionUser) {
  requireRole(user, ["ADMIN"]);
  return prisma.returnRequest.findMany({
    include: {
      customer: { include: { user: { select: { name: true, email: true } } } },
      order: { select: { externalId: true, total: true } },
    },
    orderBy: { requestedAt: "desc" },
  });
}

export async function approveReturn(returnId: string, user: SessionUser) {
  requireRole(user, ["ADMIN"]);
  return prisma.returnRequest.update({
    where: { id: returnId },
    data: { status: "APPROVED", reviewedAt: new Date(), reviewedById: user.id },
  });
}

export async function rejectReturn(returnId: string, user: SessionUser, reason: string) {
  requireRole(user, ["ADMIN"]);
  return prisma.returnRequest.update({
    where: { id: returnId },
    data: {
      status: "REJECTED",
      reviewedAt: new Date(),
      reviewedById: user.id,
      rejectionReason: reason,
    },
  });
}

export async function createTicket(
  customerId: string,
  user: SessionUser,
  data: {
    subject: string;
    description: string;
    category: TicketCategory;
    orderId?: string;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    sentiment?: "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "FRUSTRATED" | "ANGRY";
    isEscalated?: boolean;
    confidenceScore?: number;
  }
) {
  if (user.role === "CUSTOMER") assertCustomerOwnership(user, customerId);

  let resolvedOrderId: string | undefined;
  if (data.orderId) {
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: data.orderId }, { externalId: data.orderId }],
        customerId,
      },
    });
    resolvedOrderId = order?.id;
  }

  return prisma.ticket.create({
    data: {
      ticketNumber: generateTicketNumber(),
      customerId,
      orderId: resolvedOrderId,
      subject: data.subject,
      description: data.description,
      category: data.category,
      priority: data.priority || "MEDIUM",
      sentiment: data.sentiment || "NEUTRAL",
      isEscalated: data.isEscalated || false,
      confidenceScore: data.confidenceScore,
      status: data.isEscalated ? "ESCALATED" : "OPEN",
    },
  });
}

export async function getCustomerTickets(customerId: string, user: SessionUser) {
  assertCustomerOwnership(user, customerId);
  return prisma.ticket.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTicketById(ticketId: string, user: SessionUser) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      customer: { include: { user: { select: { name: true, email: true } } } },
      order: true,
    },
  });
  if (!ticket) return null;
  if (user.role === "CUSTOMER") assertCustomerOwnership(user, ticket.customerId);
  return ticket;
}

export async function listAllTickets(user: SessionUser) {
  requireRole(user, ["ADMIN", "AGENT"]);
  return prisma.ticket.findMany({
    include: {
      customer: { include: { user: { select: { name: true } } } },
      assignedAgent: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateTicket(
  ticketId: string,
  user: SessionUser,
  data: {
    status?: "OPEN" | "IN_PROGRESS" | "ESCALATED" | "RESOLVED" | "CLOSED";
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    assignedAgentId?: string;
  }
) {
  requireRole(user, ["ADMIN", "AGENT"]);
  return prisma.ticket.update({ where: { id: ticketId }, data });
}

export async function escalateTicket(
  ticketId: string,
  user: SessionUser,
  reason: string,
  priority: "HIGH" | "URGENT" = "HIGH"
) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new Error("Ticket not found");
  if (user.role === "CUSTOMER") assertCustomerOwnership(user, ticket.customerId);

  return prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status: "ESCALATED",
      isEscalated: true,
      escalationReason: reason,
      priority,
    },
  });
}
