require('dotenv').config({ path: '.env' });
const { PrismaLibSql } = require('@prisma/adapter-libsql');
const { PrismaClient } = require('@prisma/client');

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

async function run() {
  const user = await prisma.user.findUnique({
    where: { email: 'customer@techmart.pk' },
    include: { customer: { include: { orders: { take: 5, orderBy: { orderDate: 'desc' }, select: { externalId: true, status: true, total: true } } } } }
  });
  console.log('Demo customer orders:');
  user.customer.orders.forEach(o => console.log(' -', o.externalId, o.status, o.total));
  await prisma.$disconnect();
}
run().catch(e => { console.error(e.message); process.exit(1); });
