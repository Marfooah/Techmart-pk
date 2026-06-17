import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/rbac/permissions";
import { assertCustomerOwnership } from "@/lib/rbac/permissions";

export async function getOrCreateConversation(
  customerId: string,
  conversationId?: string
) {
  if (conversationId) {
    const existing = await prisma.conversation.findFirst({
      where: { id: conversationId, customerId },
    });
    if (existing) return existing;
  }
  return prisma.conversation.create({
    data: { customerId, title: "AI Support Chat", isActive: true },
  });
}

export async function getConversationHistory(
  conversationId: string,
  user: SessionUser,
  limit = 20
) {
  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });
  if (!conv) return [];
  if (user.role === "CUSTOMER") assertCustomerOwnership(user, conv.customerId);

  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
}

export async function saveMessage(
  conversationId: string,
  role: "USER" | "ASSISTANT" | "SYSTEM",
  content: string,
  meta?: { sentiment?: string; confidenceScore?: number }
) {
  return prisma.message.create({
    data: {
      conversationId,
      role,
      content,
      sentiment: meta?.sentiment as never,
      confidenceScore: meta?.confidenceScore,
    },
  });
}

export async function getRecentMessages(conversationId: string, limit = 20) {
  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
