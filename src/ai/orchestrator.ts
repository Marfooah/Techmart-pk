import { getChatModel } from "@/ai/embedder";
import { loadSystemPrompt, buildCustomerContextBlock } from "@/ai/prompts/system";
import { getCustomerContext } from "@/services/customer.service";
import {
  getOrCreateConversation,
  saveMessage,
  getRecentMessages,
} from "@/services/conversation.service";
import { createTicket } from "@/services/ticket.service";
import { logAiAction } from "@/services/audit.service";
import { executeTool, toolDefinitions } from "@/tools/registry";
import {
  classifySentiment,
  sentimentToPriority,
  shouldEscalateByKeywords,
} from "@/ai/sentiment";
import { computeConfidence, isLowConfidence } from "@/ai/confidence";
import { sanitizeOutput } from "@/ai/guardrails";
import type { ToolContext, ChatResponse } from "@/types";
import type { SessionUser } from "@/lib/rbac/permissions";

const MAX_ITERATIONS = 6;

export async function runChatAgent(
  user: SessionUser,
  message: string,
  conversationId?: string
): Promise<ChatResponse> {
  if (!user.customerId) throw new Error("Customer profile required");

  const sentiment = classifySentiment(message);
  const conversation = await getOrCreateConversation(user.customerId, conversationId);

  await saveMessage(conversation.id, "USER", message, { sentiment });

  const ctx: ToolContext = {
    userId: user.id,
    customerId: user.customerId,
    conversationId: conversation.id,
    isAI: true,
  };

  const customerContext = await getCustomerContext(user.customerId);
  const history = await getRecentMessages(conversation.id, 20);
  const systemPrompt =
    loadSystemPrompt() +
    "\n\n" +
    buildCustomerContextBlock(customerContext);

  const historyText = [...history]
    .reverse()
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  let toolSuccessCount = 0;
  let toolTotalCount = 0;
  let bestRagScore = 0.7;
  let finalText = "";
  let escalated = shouldEscalateByKeywords(message) || sentiment === "ANGRY";

  try {
    const model = getChatModel();
    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: `SYSTEM:\n${systemPrompt}` }] },
        {
          role: "model",
          parts: [{ text: "Understood. I am TechMart Pakistan support assistant." }],
        },
        ...(historyText
          ? [{ role: "user" as const, parts: [{ text: `Previous conversation:\n${historyText}` }] }]
          : []),
      ],
      tools: [{ functionDeclarations: toolDefinitions as never }],
    });

    let response = await chat.sendMessage(message);
    let iterations = 0;

    while (iterations < MAX_ITERATIONS) {
      iterations++;
      const candidate = response.response.candidates?.[0];
      const parts = candidate?.content?.parts || [];

      const functionCalls = parts.filter((p) => p.functionCall);
      const textParts = parts.filter((p) => p.text).map((p) => p.text).join("");

      if (functionCalls.length === 0) {
        finalText = textParts;
        break;
      }

      const functionResponses = [];
      for (const part of functionCalls) {
        const fc = part.functionCall!;
        const toolName = fc.name;
        const args = fc.args || {};
        toolTotalCount++;

        const toolResult = await executeTool(toolName, args, ctx);
        if (toolResult.success) toolSuccessCount++;

        if (toolName === "searchKnowledgeBase" && toolResult.result) {
          const r = toolResult.result as { results?: { score: number }[] };
          if (r.results?.[0]?.score) bestRagScore = Math.max(bestRagScore, r.results[0].score);
        }

        functionResponses.push({
          functionResponse: {
            name: toolName,
            response: toolResult.success
              ? { result: toolResult.result }
              : { error: toolResult.error },
          },
        });
      }

      response = await chat.sendMessage(functionResponses);
    }

    if (!finalText) {
      finalText =
        response.response.text() ||
        "I apologize, I could not generate a response. Let me connect you with a support specialist.";
    }
  } catch (err) {
    console.error("AI orchestrator error:", err);
    finalText =
      "I'm having trouble processing your request right now. Please try again or contact support@techmart.pk.";
    escalated = true;
  }

  const confidence = computeConfidence({
    ragScore: bestRagScore,
    toolSuccessRate: toolTotalCount ? toolSuccessCount / toolTotalCount : 1,
    workflowComplete: true,
  });

  if (isLowConfidence(confidence)) escalated = true;

  finalText = sanitizeOutput(finalText);

  if (escalated) {
    await createTicket(user.customerId, user, {
      subject: "Escalated: AI Support Handoff",
      description: `Customer message: ${message}\n\nEscalation reason: ${
        sentiment === "ANGRY"
          ? "Angry customer detected"
          : isLowConfidence(confidence)
            ? `Low confidence (${confidence.toFixed(2)})`
            : "Customer requested human support"
      }`,
      category: "OTHER",
      priority: sentimentToPriority(sentiment),
      sentiment,
      isEscalated: true,
      confidenceScore: confidence,
    });
    finalText +=
      "\n\nI've escalated your request to our support team. A specialist will follow up shortly.";
  }

  await saveMessage(conversation.id, "ASSISTANT", finalText, {
    confidenceScore: confidence,
  });

  await logAiAction({
    customerId: user.customerId,
    conversationId: conversation.id,
    toolCalled: "chat_response",
    input: { message },
    output: { response: finalText.slice(0, 500) },
    confidenceScore: confidence,
    success: true,
    escalated,
  });

  return {
    message: finalText,
    conversationId: conversation.id,
    confidence,
    escalated,
    sentiment,
  };
}
