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
  /\b(turbo|vilicus|caute|spoliatio|arguo|cohibeo|adimpleo)\b/i,
  /\b(velum|canonicus|cruentus|terebro|doloremque|contego|tabernus)\b/i,
  /\b(administratio|candidus|apparatus|tyrannus|summisse|adaugeo)\b/i,
  /\b(veritatis|caecus|corrumpo|desidero|timidus|delectatio)\b/i,
  /\b(auctus|aeneus|delectatio|conculco|exercitationem)\b/i,
  /\b(quam|coerceo|magni|credo|aestus|venustas|delectus)\b/i,
  /\b(vulgivagus|vociferor|sophismata|comburo|antiquus|amor)\b/i,
  /\b(comminor|capillus|laudantium|alo|decimus|catena|ustulo|volubilis)\b/i,
  /\b(colo|suffoco|capto|audentia|auctor|utpote|adflicto|reprehenderit)\b/i,
  /\b(soleo|arma|adfero|vado|bellicus|denuncio|pauper|temperantia)\b/i,
  /\b(conventus|sollicito|talus|denuo|adicio|volutabrum|defluo)\b/i,
  /\b(subiungo|stella|confido|volva|aperio|calamitas|circumveni)\b/i,
  /\b(denique|tergum|verus|teres|callide|vivo|vilicus|coruscus)\b/i,
  /\b(solus|cupiditas|nihil|terga|voro|utor|repellat|tripudio)\b/i,
  /\b(commodo|teneo|balbus|concedo|voluptate|sumo|cariosus)\b/i,
  /\b(amicitia|acerbitas|vomito|dolorum|calcar|impedit|tardus)\b/i,
  /\b(vinco|apostolus|cavus|usitas|uter|vapulus|valetudo|coaegresco)\b/i,
  /\b(iure|repellat|despecto|deleo|consequuntur|aiunt|tamdiu|vulgivagus)\b/i,
  /\b(nulla|saepe|pel|amaritudo|adsidue|voro|cervus)\b/i,
  /\b(deripio|adimpleo|barba|celebrer|sopor)\b/i,
  /\b(vito|esse|uberrime|harum|aeger|unde)\b/i,
  /\b(eligendi|vehemens|vulgaris)\b/i,
  /\b(vomito|beatus|terra|pel|contra|adficio|cerno|utrimque|apud)\b/i,
  /\b(aeneus|timor|ultra|ambitus|ancilla)\b/i,
  /\b(copia|vox|cupiditas|ater)\b/i,
  /\b(vetus|basium|alii|bis)\b/i,
  /\b(explicabo|tubineus|facilis|laborum|una|currus)\b/i,
  /\b(crapula|corroboro|stips|calculus|desidero|voco)\b/i,
  /\b(cicuta|trans|tametsi|hic|vociferor|demens|condico|succurro)\b/i,
  /\b(sonitus|thema|vulgo|thorax|sollers|comburo|aro|alias)\b/i,
  /\b(conor|tracto|talus|crinis|calculus|antepono)\b/i,
  /\b(cubitum|suffragium|sollicito|cruciamentum|tepesco|decretum)\b/i,
  /\b(coniecto|aspernatur|carbo|demens|ustilo|claustrum|vitium|thorax)\b/i,
  /\b(avaritia|concedo|repellat|suspendo|adhuc|quaerat|officia|aspicio)\b/i,
  /\b(inflammatio|debilito|canto|conforto|succurro|comprehendo)\b/i,
  /\b(adinventitias|taedium|sulum)\b/i,
  /\b(arcus|cito|carbo|caute|aegre|thermae|nisi|supellex)\b/i,
  /\b(magni|dens|maxime|modi|sonitus|vetus|spes|conturbo)\b/i,
  /\b(correptius|vado|quas|ulciscor|verbum|consuasor|clam)\b/i,
];

function isLatin(text) {
  if (!text) return false;
  return latinPatterns.some(pat => pat.test(text));
}

// Realistic replacement pools
const ticketDescriptions = {
  'Damaged product received': [
    'The item I received was physically damaged. The screen has visible cracks and the device does not power on. I need a replacement or full refund.',
    'My order arrived with a broken casing. There is damage to the back panel and the charging port is bent. Please arrange a return pickup.',
    'The product was damaged in transit. The box was intact but the item inside has scratches and a dent on one side. I would like a replacement unit.',
    'I received a damaged unit. The display has dead pixels and the power button is stuck. This is clearly a defective item. Please assist.',
  ],
  'Warranty claim': [
    'My laptop keyboard has keys that stopped responding after 3 months of normal use. The product is under warranty and I would like it repaired or replaced.',
    'The device battery drains completely within 30 minutes of unplugging, even after a software reset. This started 2 months after purchase and is a clear defect.',
    'My headphones stopped producing sound from the left ear after 2 months. They are within the 6-month warranty period. Please process a warranty claim.',
    'The charging adapter that came with my phone stopped working after 45 days. I need a replacement under the included warranty.',
  ],
  'Wrong item shipped': [
    'I ordered the Samsung Galaxy Buds Pro (Black) but received a completely different brand. My order confirmation clearly shows the correct item.',
    'The product in the box does not match what I ordered. I ordered a 128GB model but received a 64GB variant. Please arrange an exchange.',
    'I received a different color than ordered. I selected the Navy Blue variant but got Silver instead. Please send the correct item and arrange a return.',
    'My order contained someone else\'s item. The box label has my order number but the product inside is not what I purchased.',
  ],
  'Refund status inquiry': [
    'My return was approved 8 days ago but I have not received the refund yet. The approval email said 5-7 business days. Please provide an update.',
    'I have been waiting 12 days for my refund after the item was returned and collected. Please confirm the refund status and expected credit date.',
    'I cancelled my order before it was shipped but the payment has not been reversed to my card yet. It has been 6 business days. Please investigate.',
    'The refund was supposed to be credited to my JazzCash account within 3-5 days. It is now day 9 and I still have not received it.',
  ],
  'Order not delivered': [
    'My order shows as delivered 2 days ago but I never received it. No one was at the door and there was no notification. Please investigate.',
    'The tracking says delivered but my package is not here. I checked with my building reception and they have no record of it either.',
    'My order has been in processing for 7 days with no movement. The estimated delivery was 3 days ago. Please check with the courier.',
    'The courier marked my order as delivered but it was not. I was home all day and no one rang the bell or left a package.',
  ],
  'COD payment issue': [
    'The courier collected the cash payment but did not provide a receipt. I want confirmation that the payment has been recorded on my order.',
    'I paid the COD amount but the order still shows payment pending in my account. Please update the payment status.',
    'The rider asked for an amount different from what was shown in my order summary. I paid the original amount but want clarification.',
    'I was charged extra by the courier beyond the order total. I have the order confirmation showing the agreed amount. Please refund the difference.',
  ],
  'Tracking not updating': [
    'My tracking number has not shown any movement for 4 days. The last update was at a sorting facility. Is my order lost or delayed?',
    'The courier app shows the package is out for delivery since yesterday but it never arrived and the status has not changed.',
    'Tracking shows my order is in Karachi but I am in Lahore and it has been stuck there for 3 days. Please follow up with the courier.',
    'I have not received any tracking updates since the order was shipped 6 days ago. The tracking number shows no results on the courier website.',
  ],
};

const returnDescriptions = [
  'The product stopped working within 2 weeks of delivery. There is no physical damage — it simply does not turn on anymore. I need to return it for a replacement or refund.',
  'The item received is not as described on the website. The specifications listed do not match the actual product I received.',
  'I received the wrong item in my shipment. The product does not match my order confirmation and I need to return it.',
  'The product arrived with a manufacturing defect — the screen has a dead pixel cluster in the centre that makes it unusable.',
  'I changed my mind about this purchase and would like to return the item. It is unopened and in the original packaging.',
  'The product is defective. The battery swells up when charging and the device heats up abnormally. This is a safety concern.',
  'Wrong size/model delivered. I ordered the 15-inch version but received the 13-inch. Please arrange an exchange.',
];

const userMessages = [
  'Where is my order? It has been over a week and I have not received any updates.',
  'I want to track my order. Can you tell me the current status?',
  'My package was supposed to arrive 3 days ago. What is the delay?',
  'Can I return a product that arrived damaged?',
  'How long does the refund process take after a return is approved?',
  'I need to change my delivery address. Is that still possible?',
  'What is your return policy for electronics?',
  'The product I received is not working properly. What should I do?',
  'I want to cancel my order. It has not shipped yet.',
  'Can you tell me which courier is handling my delivery?',
  'My tracking number is not showing any results. Is this normal?',
  'I paid via COD but did not get a receipt. Can you confirm the payment?',
  'How do I file a warranty claim for a defective product?',
  'My order was delivered to the wrong address. Please help.',
  'I need the invoice for my recent purchase for business expenses.',
];

const assistantMessages = [
  'I have checked your order and it is currently with our courier partner. You should receive it within 1-2 business days. I will send you the updated tracking link.',
  'Your return request has been created with status PENDING. Our team will review it within 24 hours and you will receive an email confirmation.',
  'I have verified your order details. The refund of PKR {amount} has been initiated and should reflect in your account within 3-5 business days.',
  'I can see your order is currently at the sorting facility in your city. It is scheduled for delivery today or tomorrow.',
  'Our return policy allows returns within 7 days of delivery for electronics in original condition. I have started the return process for you.',
  'I have located your order. It was shipped via TCS with tracking number provided in your confirmation email. I can see it is out for delivery today.',
  'Your warranty claim has been registered. Our technical team will contact you within 2 business days to arrange an inspection or replacement.',
  'I apologize for the inconvenience. I have escalated your case to our support team who will contact you within 24 hours to resolve this.',
  'I have confirmed your COD payment has been recorded against your order. Your receipt will be emailed to you within the hour.',
  'Based on our policy, since the item arrived damaged, you are fully eligible for a replacement. I have created a return request on your behalf.',
];

function getReplacement(pool) {
  return pool[Math.floor(Math.random() * pool.length)];
}

function getTicketDesc(subject) {
  const key = Object.keys(ticketDescriptions).find(k => subject && subject.includes(k.split(' ')[0]));
  const pool = key ? ticketDescriptions[key] : ticketDescriptions['Damaged product received'];
  return pool[Math.floor(Math.random() * pool.length)];
}

async function run() {
  const tickets = await p.ticket.findMany({ select: { id: true, subject: true, description: true, escalationReason: true } });
  const returns = await p.returnRequest.findMany({ select: { id: true, description: true } });
  const messages = await p.message.findMany({ select: { id: true, content: true, role: true } });

  let ticketFixed = 0, returnFixed = 0, messageFixed = 0;

  for (const t of tickets) {
    const updates = {};
    if (isLatin(t.description)) {
      updates.description = getTicketDesc(t.subject);
      ticketFixed++;
    }
    if (isLatin(t.escalationReason)) {
      updates.escalationReason = 'Customer requested human support due to unresolved issue.';
    }
    if (Object.keys(updates).length > 0) {
      await p.ticket.update({ where: { id: t.id }, data: updates });
    }
  }

  for (const r of returns) {
    if (isLatin(r.description)) {
      await p.returnRequest.update({ where: { id: r.id }, data: { description: getReplacement(returnDescriptions) } });
      returnFixed++;
    }
  }

  for (const m of messages) {
    if (isLatin(m.content)) {
      const pool = m.role === 'USER' ? userMessages : assistantMessages;
      await p.message.update({ where: { id: m.id }, data: { content: getReplacement(pool) } });
      messageFixed++;
    }
  }

  console.log(`Fixed: ${ticketFixed} tickets, ${returnFixed} returns, ${messageFixed} messages`);
  await p.$disconnect();
}

run().catch(e => { console.error(e); p.$disconnect(); });
