/**
 * Replaces Latin/faker lorem placeholder text in existing database with English copy.
 * Run: npm run fix-copy
 */
import { PrismaClient } from "@prisma/client";
import {
  trackingDescription,
  returnDescription,
  ticketDescription,
  userMessage,
  assistantMessage,
  aiAuditQuery,
} from "../prisma/seed/copy";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

// Latin-like patterns from faker.lorem
function looksLikePlaceholder(text: string): boolean {
  if (!text || text.length < 8) return false;
  const latinPatterns =
    /\b(pariatur|sordeo|caterva|nesciunt|vulnus|labore|sortitus|viriliter|tenetur|lorem|ipsum|dolor|amet|consectetur|adipiscing|tempor|incididunt|bonus|cunabula|truculenter|tepidus|attero|ceno|suggero|conatus|caritas|utilis|strenuus|sodalitas|compello|ara)\b/i;
  return latinPatterns.test(text);
}

async function main() {
  console.log("🔧 Fixing placeholder text in database...\n");

  // Tracking events — replace all descriptions (all were faker lorem at seed time)
  const trackingEvents = await prisma.trackingEvent.findMany();
  for (const event of trackingEvents) {
    await prisma.trackingEvent.update({
      where: { id: event.id },
      data: { description: trackingDescription(event.eventType) },
    });
  }
  console.log(`✓ ${trackingEvents.length} tracking event descriptions updated`);

  // Return requests
  const returns = await prisma.returnRequest.findMany();
  for (const ret of returns) {
    if (!ret.description || looksLikePlaceholder(ret.description)) {
      await prisma.returnRequest.update({
        where: { id: ret.id },
        data: { description: returnDescription() },
      });
    }
  }
  console.log(`✓ ${returns.length} return descriptions checked`);

  // Tickets
  const tickets = await prisma.ticket.findMany();
  let ticketsFixed = 0;
  for (const ticket of tickets) {
    if (looksLikePlaceholder(ticket.description)) {
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { description: ticketDescription() },
      });
      ticketsFixed++;
    }
  }
  console.log(`✓ ${ticketsFixed} ticket descriptions updated`);

  // Messages
  const messages = await prisma.message.findMany();
  let messagesFixed = 0;
  for (const msg of messages) {
    if (looksLikePlaceholder(msg.content)) {
      await prisma.message.update({
        where: { id: msg.id },
        data: {
          content:
            msg.role === "USER" || msg.role === "AGENT"
              ? userMessage()
              : assistantMessage(),
        },
      });
      messagesFixed++;
    }
  }
  console.log(`✓ ${messagesFixed} chat messages updated`);

  // AI audit logs
  const auditLogs = await prisma.aiAuditLog.findMany();
  for (const log of auditLogs) {
    try {
      const input = JSON.parse(log.input);
      await prisma.aiAuditLog.update({
        where: { id: log.id },
        data: { input: JSON.stringify({ ...input, query: aiAuditQuery() }) },
      });
    } catch {
      // skip malformed JSON
    }
  }
  console.log(`✓ ${auditLogs.length} AI audit log entries updated`);

  console.log("\n✅ Placeholder text fix complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
