const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

// Fix return descriptions with Latin text
const returnFixes = {
  'cmqex1ccv00j2anos3khhlcnk': 'The item I ordered arrived in completely different condition than advertised. The product has signs of previous use and the packaging was resealed. I want a refund.',
  'cmqex1cd900jaanosc7aysgti': 'The color of the product received does not match what was shown on the product page. I ordered the red variant but received a grey one. Please arrange an exchange.',
  'cmqex1cdj00jianosvmofk5tu': 'The product stopped working after just 3 days of normal use. There is no physical damage from my side — it simply will not power on. Requesting replacement.',
  'cmqex1cdl00jkanosxy11n8za': 'I received the wrong model entirely. What I got does not match my order summary at all. Please arrange a return pickup and send the correct item.',
  'cmqex1cdo00jmanospsd11se2': 'The product was missing key accessories that are listed as included in the box (charging cable and adapter). The item itself seems used. I need a full replacement.',
};

// Fix message content with Latin text
const messageFixes = {
  'cmqex1cr100r2anosyvx7q1jl': 'How do I check if my order is eligible for a return?',
  'cmqex1crn00roanos9onesb2x': 'I need help with my recent order. Can you look it up for me?',
  'cmqex1ct000swanosoijm8yin': 'My order was marked as delivered but I never received it.',
  'cmqex1cuk00u6anosm2duo8av': 'Can you help me track my shipment?',
  'cmqex1cxf00wcanosbsrxw7bl': 'The courier tried to deliver but I was not home. How do I reschedule?',
  'cmqex1cxo00wianose02xuodz': 'I have been waiting for my refund for over a week. Can you check the status?',
  'cmqex1cxu00wmanosud9yodqs': 'Is my order still in processing or has it been shipped yet?',
  'cmqex1cy000wqanost95znf9s': 'I want to know the return window for electronics.',
  'cmqex1d1v00zeanosg61r2hgr': 'What payment methods are accepted for online orders?',
  'cmqex1d2e00zoanosgpjjo87t': 'I have not received any updates on my order for the past 4 days.',
};

async function run() {
  let fixed = 0;

  for (const [id, description] of Object.entries(returnFixes)) {
    await p.returnRequest.update({ where: { id }, data: { description } });
    console.log('Fixed return: ' + id);
    fixed++;
  }

  for (const [id, content] of Object.entries(messageFixes)) {
    await p.message.update({ where: { id }, data: { content } });
    console.log('Fixed message: ' + id);
    fixed++;
  }

  console.log('Total fixed: ' + fixed);
  await p.$disconnect();
}

run().catch(e => { console.error(e); p.$disconnect(); });
