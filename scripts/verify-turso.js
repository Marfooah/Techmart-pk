require('dotenv').config({ path: '.env' });
const { PrismaLibSql } = require('@prisma/adapter-libsql');
const { PrismaClient } = require('@prisma/client');

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

async function run() {
  const [users, orders, products, chunks] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.product.count(),
    prisma.knowledgeChunk.count(),
  ]);
  const customer = await prisma.user.findUnique({ where: { email: 'customer@techmart.pk' }, select: { email: true, role: true } });
  const admin = await prisma.user.findUnique({ where: { email: 'admin@techmart.pk' }, select: { email: true, role: true } });
  console.log({ users, orders, products, chunks });
  console.log('customer@techmart.pk:', customer);
  console.log('admin@techmart.pk:', admin);
  await prisma.$disconnect();
}
run().catch(e => { console.error(e.message); process.exit(1); });
