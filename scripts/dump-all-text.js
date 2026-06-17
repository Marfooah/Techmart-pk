const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function run() {
  const returns = await p.returnRequest.findMany({
    select: { id: true, description: true, rejectionReason: true }
  });
  const tickets = await p.ticket.findMany({
    select: { id: true, subject: true, description: true, escalationReason: true }
  });
  const messages = await p.message.findMany({
    select: { id: true, content: true, role: true }
  });
  const tracking = await p.trackingEvent.findMany({
    select: { id: true, description: true, location: true, status: true }
  });
  const products = await p.product.findMany({
    select: { id: true, name: true, description: true, bestFor: true }
  });

  console.log('=== RETURNS ===');
  returns.forEach(r => {
    console.log('ID:' + r.id);
    console.log('DESC:' + (r.description || ''));
    console.log('REJ:' + (r.rejectionReason || ''));
    console.log('---');
  });

  console.log('=== TICKETS ===');
  tickets.forEach(t => {
    console.log('ID:' + t.id);
    console.log('SUBJ:' + (t.subject || ''));
    console.log('DESC:' + (t.description || ''));
    console.log('ESC:' + (t.escalationReason || ''));
    console.log('---');
  });

  console.log('=== MESSAGES ===');
  messages.forEach(m => {
    console.log('ID:' + m.id + '|ROLE:' + m.role + '|' + m.content);
    console.log('---');
  });

  console.log('=== TRACKING ===');
  tracking.forEach(t => {
    console.log('ID:' + t.id + '|STATUS:' + t.status + '|LOC:' + (t.location||'') + '|DESC:' + (t.description||''));
    console.log('---');
  });

  await p.$disconnect();
}
run().catch(e => { console.error(e); p.$disconnect(); });
