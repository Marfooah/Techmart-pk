const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const latinPatterns = [
  /\b(lorem|ipsum|dolor|sit amet|consectetur|adipiscing|elit)\b/i,
  /\b(eum|volo|audax|trado|debilito|cupiditate|torqueo|deputo|peccatus)\b/i,
  /\b(tutis|creptio|sufficio|appono|angulus|certus|degero)\b/i,
  /\b(thymbra|stillicidium|cunae|creo|suspendo|defessus|cursim)\b/i,
  /\b(triduana|veritas|templum|tubineus|vulticulus|conqueror)\b/i,
  /\b(tactus|caput|villa|adsum|considero|volaticus|sponte|adulatio|aeger)\b/i,
  /\b(cumque|copiose|taedium|derideo|casso|volutabrum|ancilla|deripio)\b/i,
  /\b(spectaculum|vetus|atqui|supellex|voluptatum|cunctatio)\b/i,
  /\b(advenio|pecto|undique|demitto|vallum|careo|solium|mollitia)\b/i,
  /\b(ulterius|vilis|videlicet|velut|amplitudo|uredo)\b/i,
  /\b(tracto|veritatis|itaque|aufero|adiuvo|claustrum|atrox)\b/i,
  /\b(armarium|demergo|virtus|speculum|agnitio|averto|substantia)\b/i,
  /\b(cicuta|synagoga|vitiosus|benigne)\b/i,
  /\b(ciminatio|ducimus|allatus|acidus|similique)\b/i,
  /\b(deserunt|accusamus|crinis|terreo|totidem)\b/i,
  /\b(conservo|culpa|capto|sortitus|correptius|crastinus)\b/i,
  /\b(spero|tribuo|absens|decor|deficio|talio|sopor)\b/i,
];

function isLatin(text) {
  if (!text) return false;
  return latinPatterns.some(pat => pat.test(text));
}

async function run() {
  const tickets = await p.ticket.findMany({ select: { id: true, subject: true, description: true, escalationReason: true } });
  const returns = await p.returnRequest.findMany({ select: { id: true, description: true, rejectionReason: true } });
  const products = await p.product.findMany({ select: { id: true, name: true, description: true, bestFor: true } });
  const messages = await p.message.findMany({ select: { id: true, content: true, role: true } });
  const tracking = await p.trackingEvent.findMany({ select: { id: true, description: true, location: true, status: true } });
  const knowledgeChunks = await p.knowledgeChunk.findMany({ select: { id: true, content: true } });

  let found = 0;

  for (const t of tickets) {
    if (isLatin(t.subject) || isLatin(t.description) || isLatin(t.escalationReason)) {
      console.log('TICKET|' + t.id + '|' + t.subject + '|' + (t.description || '').slice(0, 100));
      found++;
    }
  }
  for (const r of returns) {
    if (isLatin(r.description) || isLatin(r.rejectionReason)) {
      console.log('RETURN|' + r.id + '|' + (r.description || '').slice(0, 100));
      found++;
    }
  }
  for (const prod of products) {
    if (isLatin(prod.description) || isLatin(prod.bestFor) || isLatin(prod.name)) {
      console.log('PRODUCT|' + prod.id + '|' + prod.name + '|' + (prod.description || '').slice(0, 100));
      found++;
    }
  }
  for (const m of messages) {
    if (isLatin(m.content)) {
      console.log('MESSAGE|' + m.id + '|' + m.role + '|' + m.content.slice(0, 100));
      found++;
    }
  }
  for (const t of tracking) {
    if (isLatin(t.description) || isLatin(t.location) || isLatin(t.status)) {
      console.log('TRACKING|' + t.id + '|' + t.status + '|' + (t.description || '').slice(0, 100));
      found++;
    }
  }
  for (const c of knowledgeChunks) {
    if (isLatin(c.content)) {
      console.log('CHUNK|' + c.id + '|' + c.content.slice(0, 100));
      found++;
    }
  }

  console.log('Total found: ' + found);
  await p.$disconnect();
}

run().catch(e => { console.error(e); p.$disconnect(); });
