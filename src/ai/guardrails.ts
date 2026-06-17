import type { ToolContext } from "@/types";

const BLOCKED_AI_TOOLS = new Set(["updateTicket"]);

const BLOCKED_OUTPUT_PATTERNS = [
  /system prompt/i,
  /internal instruction/i,
  /tool_called/i,
  /function declaration/i,
];

export function preToolGuard(
  toolName: string,
  args: unknown,
  ctx: ToolContext
): { allowed: boolean; reason?: string } {
  if (!ctx.customerId) {
    return { allowed: false, reason: "No customer context" };
  }

  if (ctx.isAI && BLOCKED_AI_TOOLS.has(toolName)) {
    return { allowed: false, reason: `AI cannot call ${toolName}` };
  }

  if (toolName === "createReturnRequest" || toolName === "getOrder") {
    const a = args as { orderId?: string };
    if (!a.orderId) {
      return { allowed: false, reason: "orderId required for verification" };
    }
  }

  return { allowed: true };
}

export function postToolGuard(
  toolName: string,
  result: unknown
): { safe: boolean; result: unknown } {
  if (toolName === "createReturnRequest") {
    const r = result as { status?: string };
    if (r?.status && r.status !== "PENDING") {
      return { safe: false, result: { error: "Returns must start as PENDING" } };
    }
  }
  return { safe: true, result };
}

export function sanitizeOutput(text: string): string {
  for (const pattern of BLOCKED_OUTPUT_PATTERNS) {
    if (pattern.test(text)) {
      return "I'm here to help with your TechMart Pakistan order or support needs. How can I assist you?";
    }
  }
  return text;
}
