import { prisma } from "@/lib/db";

export async function getProductById(productId: string) {
  return prisma.product.findFirst({
    where: {
      OR: [{ id: productId }, { externalId: productId }, { sku: productId }],
    },
  });
}

export async function listProducts() {
  return prisma.product.findMany({ orderBy: { name: "asc" } });
}
