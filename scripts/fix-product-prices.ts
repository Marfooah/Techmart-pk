/**
 * Updates product prices to PKR without full reseed.
 * Run: npx tsx scripts/fix-product-prices.ts
 */
import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import * as path from "path";

const prisma = new PrismaClient();
const DATA_DIR = path.join(process.cwd(), "data/source");

function buildOrderPriceMap(orderRows: Record<string, unknown>[]) {
  const buckets = new Map<string, number[]>();
  for (const row of orderRows) {
    const id = String(row["Product ID"]);
    const price = Number(row["Unit Price (PKR)"]);
    if (!id || !price) continue;
    if (!buckets.has(id)) buckets.set(id, []);
    buckets.get(id)!.push(price);
  }
  const avg = new Map<string, number>();
  for (const [id, prices] of buckets) {
    avg.set(id, Math.round(prices.reduce((a, b) => a + b, 0) / prices.length));
  }
  return avg;
}

function resolveProductPricePkr(
  externalId: string,
  catalogPrice: number,
  category: string,
  orderPriceMap: Map<string, number>
): number {
  const fromOrders = orderPriceMap.get(externalId);
  if (fromOrders) return fromOrders;
  const cat = category.toLowerCase();
  let rate = 285;
  if (cat.includes("laptop") || cat.includes("desktop")) rate = 295;
  else if (cat.includes("phone") || cat.includes("tablet")) rate = 290;
  const pkr = catalogPrice * rate;
  return Math.max(999, Math.round(pkr / 500) * 500);
}

async function main() {
  const ordersWb = XLSX.readFile(path.join(DATA_DIR, "pakistan_orders.xlsx"));
  const orderRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    ordersWb.Sheets[ordersWb.SheetNames[0]]
  );
  const orderPriceMap = buildOrderPriceMap(orderRows);

  const productsWb = XLSX.readFile(path.join(DATA_DIR, "products.xlsx"));
  const productRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    productsWb.Sheets[productsWb.SheetNames[0]]
  );

  let updated = 0;
  for (const row of productRows) {
    const externalId = String(row["Product ID"]);
    const pricePkr = resolveProductPricePkr(
      externalId,
      Number(row["Price"]) || 0,
      String(row["Category"]),
      orderPriceMap
    );
    const result = await prisma.product.updateMany({
      where: { externalId },
      data: { price: pricePkr, currency: "PKR" },
    });
    updated += result.count;
  }
  console.log(`✓ Updated ${updated} products to PKR pricing`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
