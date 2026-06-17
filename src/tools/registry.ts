import { z } from "zod";
import type { ToolContext } from "@/types";
import { searchKnowledgeBase } from "@/ai/rag/search";
import { getCustomerById } from "@/services/customer.service";
import { getOrderById, getCustomerOrders, trackOrder } from "@/services/order.service";
import { getProductById } from "@/services/product.service";
import {
  createReturnRequest,
  createTicket,
  escalateTicket,
  updateTicket,
} from "@/services/ticket.service";
import {
  getConversationHistory,
  saveMessage,
} from "@/services/conversation.service";
import { logAiAction } from "@/services/audit.service";
import { preToolGuard, postToolGuard } from "@/ai/guardrails";
import type { SessionUser } from "@/lib/rbac/permissions";

export const toolSchemas = {
  searchKnowledgeBase: z.object({
    query: z.string().min(1),
    topK: z.number().optional(),
  }),
  getCustomer: z.object({}),
  getOrder: z.object({ orderId: z.string() }),
  getCustomerOrders: z.object({}),
  trackOrder: z.object({ orderId: z.string() }),
  getProduct: z.object({ productId: z.string() }),
  createReturnRequest: z.object({
    orderId: z.string(),
    reason: z.enum([
      "DAMAGED",
      "DEFECTIVE",
      "WRONG_ITEM",
      "NOT_AS_DESCRIBED",
      "CHANGED_MIND",
      "OTHER",
    ]),
    description: z.string().optional(),
  }),
  createSupportTicket: z.object({
    subject: z.string(),
    description: z.string(),
    category: z.enum([
      "ORDER",
      "SHIPPING",
      "RETURN",
      "REFUND",
      "WARRANTY",
      "PRODUCT",
      "ACCOUNT",
      "OTHER",
    ]),
    orderId: z.string().optional(),
  }),
  updateTicket: z.object({
    ticketId: z.string(),
    status: z
      .enum(["OPEN", "IN_PROGRESS", "ESCALATED", "RESOLVED", "CLOSED"])
      .optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  }),
  escalateTicket: z.object({
    ticketId: z.string(),
    reason: z.string(),
    priority: z.enum(["HIGH", "URGENT"]).optional(),
  }),
  getConversationHistory: z.object({
    conversationId: z.string(),
    limit: z.number().optional(),
  }),
  saveConversationMessage: z.object({
    conversationId: z.string(),
    role: z.enum(["USER", "ASSISTANT", "SYSTEM"]),
    content: z.string(),
  }),
};

export const toolDefinitions = [
  {
    name: "searchKnowledgeBase",
    description:
      "Search TechMart Pakistan knowledge base for policies, FAQs, shipping, returns, warranty, and company info.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        topK: { type: "number", description: "Number of results" },
      },
      required: ["query"],
    },
  },
  {
    name: "getCustomer",
    description: "Get the current authenticated customer profile.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "getOrder",
    description: "Get order details by order ID. Customer must own the order.",
    parameters: {
      type: "object",
      properties: { orderId: { type: "string" } },
      required: ["orderId"],
    },
  },
  {
    name: "getCustomerOrders",
    description: "List all orders for the current customer.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "trackOrder",
    description: "Get tracking events for an order.",
    parameters: {
      type: "object",
      properties: { orderId: { type: "string" } },
      required: ["orderId"],
    },
  },
  {
    name: "getProduct",
    description: "Get product details by product ID or SKU.",
    parameters: {
      type: "object",
      properties: { productId: { type: "string" } },
      required: ["productId"],
    },
  },
  {
    name: "createReturnRequest",
    description:
      "Create a PENDING return request. Does NOT approve the return. Requires order verification.",
    parameters: {
      type: "object",
      properties: {
        orderId: { type: "string" },
        reason: {
          type: "string",
          enum: [
            "DAMAGED",
            "DEFECTIVE",
            "WRONG_ITEM",
            "NOT_AS_DESCRIBED",
            "CHANGED_MIND",
            "OTHER",
          ],
        },
        description: { type: "string" },
      },
      required: ["orderId", "reason"],
    },
  },
  {
    name: "createSupportTicket",
    description: "Create a new support ticket for the customer.",
    parameters: {
      type: "object",
      properties: {
        subject: { type: "string" },
        description: { type: "string" },
        category: {
          type: "string",
          enum: [
            "ORDER",
            "SHIPPING",
            "RETURN",
            "REFUND",
            "WARRANTY",
            "PRODUCT",
            "ACCOUNT",
            "OTHER",
          ],
        },
        orderId: { type: "string" },
      },
      required: ["subject", "description", "category"],
    },
  },
  {
    name: "updateTicket",
    description: "Update ticket status or priority. Admin/Agent only.",
    parameters: {
      type: "object",
      properties: {
        ticketId: { type: "string" },
        status: { type: "string" },
        priority: { type: "string" },
      },
      required: ["ticketId"],
    },
  },
  {
    name: "escalateTicket",
    description: "Escalate a ticket to a human agent.",
    parameters: {
      type: "object",
      properties: {
        ticketId: { type: "string" },
        reason: { type: "string" },
        priority: { type: "string", enum: ["HIGH", "URGENT"] },
      },
      required: ["ticketId", "reason"],
    },
  },
  {
    name: "getConversationHistory",
    description: "Get recent messages from the current conversation.",
    parameters: {
      type: "object",
      properties: {
        conversationId: { type: "string" },
        limit: { type: "number" },
      },
      required: ["conversationId"],
    },
  },
  {
    name: "saveConversationMessage",
    description: "Save a message to the conversation history.",
    parameters: {
      type: "object",
      properties: {
        conversationId: { type: "string" },
        role: { type: "string", enum: ["USER", "ASSISTANT", "SYSTEM"] },
        content: { type: "string" },
      },
      required: ["conversationId", "role", "content"],
    },
  },
];

function toSessionUser(ctx: ToolContext): SessionUser {
  return {
    id: ctx.userId,
    email: "",
    name: "",
    role: "CUSTOMER",
    customerId: ctx.customerId,
  };
}

export async function executeTool(
  name: string,
  rawArgs: unknown,
  ctx: ToolContext
): Promise<{ success: boolean; result: unknown; error?: string }> {
  const guard = preToolGuard(name, rawArgs, ctx);
  if (!guard.allowed) {
    await logAiAction({
      customerId: ctx.customerId,
      conversationId: ctx.conversationId,
      toolCalled: name,
      input: rawArgs,
      success: false,
      errorMessage: guard.reason,
    });
    return { success: false, result: null, error: guard.reason };
  }

  const schema = toolSchemas[name as keyof typeof toolSchemas];
  if (!schema) return { success: false, result: null, error: `Unknown tool: ${name}` };

  const parsed = schema.safeParse(rawArgs);
  if (!parsed.success) {
    await logAiAction({
      customerId: ctx.customerId,
      conversationId: ctx.conversationId,
      toolCalled: name,
      input: rawArgs,
      success: false,
      errorMessage: parsed.error.message,
    });
    return { success: false, result: null, error: parsed.error.message };
  }

  const user = toSessionUser(ctx);
  let result: unknown;

  try {
    switch (name) {
      case "searchKnowledgeBase": {
        const args = parsed.data as z.infer<typeof toolSchemas.searchKnowledgeBase>;
        result = await searchKnowledgeBase(args.query, args.topK || 3);
        break;
      }
      case "getCustomer":
        result = await getCustomerById(ctx.customerId, user);
        break;
      case "getOrder": {
        const args = parsed.data as z.infer<typeof toolSchemas.getOrder>;
        result = await getOrderById(args.orderId, user);
        break;
      }
      case "getCustomerOrders":
        result = await getCustomerOrders(ctx.customerId, user);
        break;
      case "trackOrder": {
        const args = parsed.data as z.infer<typeof toolSchemas.trackOrder>;
        result = await trackOrder(args.orderId, user);
        break;
      }
      case "getProduct": {
        const args = parsed.data as z.infer<typeof toolSchemas.getProduct>;
        result = await getProductById(args.productId);
        break;
      }
      case "createReturnRequest": {
        const args = parsed.data as z.infer<typeof toolSchemas.createReturnRequest>;
        result = await createReturnRequest(ctx.customerId, user, args);
        break;
      }
      case "createSupportTicket": {
        const args = parsed.data as z.infer<typeof toolSchemas.createSupportTicket>;
        result = await createTicket(ctx.customerId, user, args);
        break;
      }
      case "updateTicket": {
        const args = parsed.data as z.infer<typeof toolSchemas.updateTicket>;
        result = await updateTicket(args.ticketId, user, args);
        break;
      }
      case "escalateTicket": {
        const args = parsed.data as z.infer<typeof toolSchemas.escalateTicket>;
        result = await escalateTicket(
          args.ticketId,
          user,
          args.reason,
          args.priority || "HIGH"
        );
        break;
      }
      case "getConversationHistory": {
        const args = parsed.data as z.infer<typeof toolSchemas.getConversationHistory>;
        result = await getConversationHistory(
          args.conversationId || ctx.conversationId,
          user,
          args.limit
        );
        break;
      }
      case "saveConversationMessage": {
        const args = parsed.data as z.infer<typeof toolSchemas.saveConversationMessage>;
        result = await saveMessage(args.conversationId, args.role, args.content);
        break;
      }
      default:
        throw new Error(`Unhandled tool: ${name}`);
    }

    const post = postToolGuard(name, result);
    await logAiAction({
      customerId: ctx.customerId,
      conversationId: ctx.conversationId,
      toolCalled: name,
      input: rawArgs,
      output: post.result,
      success: true,
    });
    return { success: true, result: post.result };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tool execution failed";
    await logAiAction({
      customerId: ctx.customerId,
      conversationId: ctx.conversationId,
      toolCalled: name,
      input: rawArgs,
      success: false,
      errorMessage: message,
    });
    return { success: false, result: null, error: message };
  }
}
