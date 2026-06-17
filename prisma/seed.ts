import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";
import * as XLSX from "xlsx";
import * as path from "path";
import * as fs from "fs";
import { hashPassword } from "../src/lib/auth/password";
import {
  generateTicketNumber,
  mapOrderStatus,
  mapPaymentMethod,
} from "../src/lib/utils";
import {
  trackingDescription,
  returnDescription,
  ticketDescription,
  userMessage,
  assistantMessage,
  aiAuditQuery,
} from "./seed/copy";

const prisma = new PrismaClient();
const DATA_DIR = path.join(process.cwd(), "data/source");

function excelDateToJS(serial: number): Date {
  const utcDays = Math.floor(serial - 25569);
  return new Date(utcDays * 86400 * 1000);
}

function parseWarrantyMonths(warranty: string): number {
  const match = warranty.match(/(\d+)/);
  return match ? parseInt(match[1], 10) * (warranty.toLowerCase().includes("year") ? 12 : 1) : 12;
}

function mapProductStatus(status: string) {
  const s = status.toLowerCase();
  if (s.includes("out")) return "OUT_OF_STOCK" as const;
  if (s.includes("discontinued")) return "DISCONTINUED" as const;
  return "ACTIVE" as const;
}

/** Build average PKR unit price per product from order spreadsheet */
function buildOrderPriceMap(
  orderRows: Record<string, unknown>[]
): Map<string, number> {
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

/**
 * Catalog xlsx uses USD-style list prices. Convert to realistic PKR for Pakistan.
 * Prefer actual order prices when available.
 */
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
  else if (cat.includes("gaming") || cat.includes("monitor")) rate = 288;
  else if (cat.includes("audio") || cat.includes("access")) rate = 275;

  const pkr = catalogPrice * rate;
  return Math.max(999, Math.round(pkr / 500) * 500);
}

const RETURN_REASONS = [
  "DAMAGED",
  "DEFECTIVE",
  "WRONG_ITEM",
  "NOT_AS_DESCRIBED",
  "CHANGED_MIND",
  "OTHER",
] as const;

const TICKET_CATEGORIES = [
  "ORDER",
  "SHIPPING",
  "RETURN",
  "REFUND",
  "WARRANTY",
  "PRODUCT",
  "ACCOUNT",
  "OTHER",
] as const;

const SENTIMENTS = [
  "POSITIVE",
  "NEUTRAL",
  "NEGATIVE",
  "FRUSTRATED",
  "ANGRY",
] as const;

const TRACKING_TYPES = [
  "ORDER_PLACED",
  "PROCESSING",
  "SHIPPED",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "DELAYED",
] as const;

const CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Hyderabad",
  "Sialkot",
];

const PROVINCES = [
  "Punjab",
  "Sindh",
  "KPK",
  "Balochistan",
  "ICT",
  "AJK",
];

async function main() {
  console.log("🌱 Seeding TechMart Pakistan database...");

  const passwordHash = await hashPassword("Password123!");

  // Demo users
  const admin = await prisma.user.create({
    data: {
      email: "admin@techmart.pk",
      passwordHash,
      name: "Admin User",
      role: "ADMIN",
    },
  });

  const agent = await prisma.user.create({
    data: {
      email: "agent@techmart.pk",
      passwordHash,
      name: "Support Agent",
      role: "AGENT",
    },
  });

  // Load order rows early for PKR price mapping
  const ordersWb = XLSX.readFile(path.join(DATA_DIR, "pakistan_orders.xlsx"));
  const orderRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    ordersWb.Sheets[ordersWb.SheetNames[0]]
  );
  const orderPriceMap = buildOrderPriceMap(orderRows);

  // Products from xlsx (PKR prices)
  const productsWb = XLSX.readFile(path.join(DATA_DIR, "products.xlsx"));
  const productRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    productsWb.Sheets[productsWb.SheetNames[0]]
  );

  const productMap = new Map<string, string>();

  for (const row of productRows) {
    const externalId = String(row["Product ID"]);
    const category = String(row["Category"]);
    const catalogPrice = Number(row["Price"]) || 0;
    const pricePkr = resolveProductPricePkr(
      externalId,
      catalogPrice,
      category,
      orderPriceMap
    );

    const product = await prisma.product.create({
      data: {
        externalId,
        sku: String(row["SKU"]),
        name: String(row["Name"]),
        brand: String(row["Brand"] || ""),
        category,
        price: pricePkr,
        currency: "PKR",
        stock: Number(row["Units Available"]) || 0,
        status: mapProductStatus(String(row["Stock Status"] || "In Stock")),
        unitsAvailable: Number(row["Units Available"]) || 0,
        warrantyMonths: parseWarrantyMonths(String(row["Warranty"] || "1 Year")),
        rating: Number(row["Rating"]) || 4.0,
        bestFor: String(row["Best For"] || ""),
        description: String(row["Description"] || ""),
      },
    });
    productMap.set(externalId, product.id);
  }
  console.log(`✓ ${productRows.length} products imported (PKR pricing)`);

  // Orders from xlsx (orderRows already loaded)

  const customerByKey = new Map<string, string>();
  const orderMap = new Map<string, string>();
  const allCustomerIds: string[] = [];

  async function getOrCreateCustomer(
    name: string,
    phone: string,
    address: string,
    city: string,
    province: string,
    postalCode: string
  ): Promise<string> {
    const key = `${name}|${phone}`;
    if (customerByKey.has(key)) return customerByKey.get(key)!;

    const email = `${name.toLowerCase().replace(/[^a-z0-9]/g, ".")}.${phone}@customer.techmart.pk`;
    const uniqueEmail = email.length > 100 ? `customer.${faker.string.alphanumeric(8)}@techmart.pk` : email;

    const user = await prisma.user.create({
      data: {
        email: uniqueEmail,
        passwordHash,
        name,
        role: "CUSTOMER",
        customer: {
          create: {
            phone: String(phone),
            shippingAddress: address,
            city,
            province,
            postalCode: String(postalCode),
          },
        },
      },
      include: { customer: true },
    });

    const customerId = user.customer!.id;
    customerByKey.set(key, customerId);
    allCustomerIds.push(customerId);
    return customerId;
  }

  // Group order rows by Order ID
  const orderGroups = new Map<string, Record<string, unknown>[]>();
  for (const row of orderRows) {
    const orderId = String(row["Order ID"]);
    if (!orderGroups.has(orderId)) orderGroups.set(orderId, []);
    orderGroups.get(orderId)!.push(row);
  }

  for (const [externalOrderId, rows] of orderGroups) {
    const first = rows[0];
    const customerId = await getOrCreateCustomer(
      String(first["Customer Name"]),
      String(first["Phone Number"]),
      String(first["Shipping Address"]),
      String(first["City"]),
      String(first["Province"]),
      String(first["Postal Code"])
    );

    let orderDate: Date;
    if (first["Days Ago"] != null) {
      orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - Number(first["Days Ago"]));
    } else if (typeof first["Order Date"] === "number") {
      orderDate = excelDateToJS(first["Order Date"] as number);
    } else {
      orderDate = faker.date.recent({ days: 90 });
    }

    const total = rows.reduce((sum, r) => sum + Number(r["Total Price (PKR)"] || 0), 0);

    const order = await prisma.order.create({
      data: {
        externalId: externalOrderId,
        orderDate,
        customerId,
        status: mapOrderStatus(String(first["Order Status"])) as never,
        paymentMethod: mapPaymentMethod(String(first["Payment Method"])) as never,
        courierPartner: String(first["Courier Partner"] || ""),
        trackingNumber: String(first["Tracking Number"] || ""),
        shippingAddress: String(first["Shipping Address"]),
        city: String(first["City"]),
        province: String(first["Province"]),
        postalCode: String(first["Postal Code"]),
        subtotal: total,
        total,
        currency: "PKR",
        items: {
          create: rows
            .filter((r) => productMap.has(String(r["Product ID"])))
            .map((r) => ({
              productId: productMap.get(String(r["Product ID"]))!,
              quantity: Number(r["Quantity"]) || 1,
              unitPrice: Number(r["Unit Price (PKR)"]) || 0,
              totalPrice: Number(r["Total Price (PKR)"]) || 0,
            })),
        },
      },
    });
    orderMap.set(externalOrderId, order.id);
  }
  console.log(`✓ ${orderGroups.size} orders imported`);

  // Demo customer with known login
  const demoCustomer = await prisma.user.create({
    data: {
      email: "customer@techmart.pk",
      passwordHash,
      name: "Ahmed Khan",
      role: "CUSTOMER",
      customer: {
        create: {
          phone: "03001234567",
          shippingAddress: "House 42, Street 5, DHA Phase 6",
          city: "Lahore",
          province: "Punjab",
          postalCode: "54000",
        },
      },
    },
    include: { customer: true },
  });
  allCustomerIds.push(demoCustomer.customer!.id);

  // Link demo customer to first order if exists
  const firstOrder = await prisma.order.findFirst({ orderBy: { orderDate: "desc" } });
  if (firstOrder) {
    await prisma.order.update({
      where: { id: firstOrder.id },
      data: { customerId: demoCustomer.customer!.id },
    });
  }

  // Faker customers to reach 80-100 total
  const targetCustomers = 90;
  while (allCustomerIds.length < targetCustomers) {
    const name = faker.person.fullName();
    const phone = `03${faker.string.numeric(9)}`;
    const id = await getOrCreateCustomer(
      name,
      phone,
      faker.location.streetAddress(),
      faker.helpers.arrayElement(CITIES),
      faker.helpers.arrayElement(PROVINCES),
      faker.string.numeric(5)
    );
    if (!allCustomerIds.includes(id)) allCustomerIds.push(id);
  }
  console.log(`✓ ${allCustomerIds.length} customers created`);

  const allOrders = await prisma.order.findMany();
  const deliveredOrders = allOrders.filter((o) => o.status === "DELIVERED");

  // Return requests (30-40)
  const returnCount = faker.number.int({ min: 30, max: 40 });
  const usedOrderIds = new Set<string>();
  for (let i = 0; i < returnCount; i++) {
    const order = faker.helpers.arrayElement(deliveredOrders.length ? deliveredOrders : allOrders);
    if (usedOrderIds.has(order.id) && usedOrderIds.size < allOrders.length) continue;
    usedOrderIds.add(order.id);
    await prisma.returnRequest.create({
      data: {
        orderId: order.id,
        customerId: order.customerId,
        reason: faker.helpers.arrayElement([...RETURN_REASONS]),
        description: returnDescription(),
        status: faker.helpers.arrayElement([
          "PENDING",
          "PENDING",
          "UNDER_REVIEW",
          "APPROVED",
          "REJECTED",
        ] as const),
        requestedAt: faker.date.recent({ days: 30 }),
      },
    });
  }
  console.log(`✓ ${returnCount} return requests created`);

  // Tickets (50-60)
  const ticketCount = faker.number.int({ min: 50, max: 60 });
  const ticketIds: string[] = [];
  for (let i = 0; i < ticketCount; i++) {
    const customerId = faker.helpers.arrayElement(allCustomerIds);
    const order = faker.helpers.maybe(() => faker.helpers.arrayElement(allOrders), { probability: 0.6 });
    const sentiment = faker.helpers.arrayElement([...SENTIMENTS]);
    const priority =
      sentiment === "ANGRY"
        ? "HIGH"
        : sentiment === "FRUSTRATED"
          ? "MEDIUM"
          : faker.helpers.arrayElement(["LOW", "MEDIUM"] as const);

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: generateTicketNumber(),
        customerId,
        orderId: order?.customerId === customerId ? order.id : undefined,
        subject: faker.helpers.arrayElement([
          "Damaged product received",
          "Order not delivered",
          "Wrong item shipped",
          "Refund status inquiry",
          "Warranty claim",
          "Tracking not updating",
          "COD payment issue",
        ]),
        description: ticketDescription(),
        category: faker.helpers.arrayElement([...TICKET_CATEGORIES]),
        status: faker.helpers.arrayElement([
          "OPEN",
          "IN_PROGRESS",
          "ESCALATED",
          "RESOLVED",
          "CLOSED",
        ] as const),
        priority,
        sentiment,
        isEscalated: priority === "HIGH" || faker.datatype.boolean({ probability: 0.15 }),
        assignedAgentId: faker.datatype.boolean({ probability: 0.5 }) ? agent.id : undefined,
        resolutionType: faker.helpers.maybe(
          () => faker.helpers.arrayElement(["AI", "HUMAN", "HYBRID"] as const),
          { probability: 0.4 }
        ),
      },
    });
    ticketIds.push(ticket.id);
  }
  console.log(`✓ ${ticketCount} tickets created`);

  // Conversations + Messages (200-300 messages)
  const messageTarget = faker.number.int({ min: 200, max: 300 });
  let messageCount = 0;
  const conversationIds: string[] = [];

  while (messageCount < messageTarget) {
    const customerId = faker.helpers.arrayElement(allCustomerIds);
    const customerTickets = await prisma.ticket.findMany({
      where: { customerId },
      take: 5,
    });
    const ticket =
      customerTickets.length && faker.datatype.boolean({ probability: 0.3 })
        ? faker.helpers.arrayElement(customerTickets)
        : undefined;

    const conv = await prisma.conversation.create({
      data: {
        customerId,
        ticketId: ticket?.id,
        title: faker.helpers.arrayElement([
          "Order inquiry",
          "Return request help",
          "Product question",
          "Shipping delay",
        ]),
      },
    });
    conversationIds.push(conv.id);

    const msgsInConv = faker.number.int({ min: 2, max: 8 });
    for (let m = 0; m < msgsInConv && messageCount < messageTarget; m++) {
      const isUser = m % 2 === 0;
      await prisma.message.create({
        data: {
          conversationId: conv.id,
          role: isUser ? "USER" : "ASSISTANT",
          content: isUser ? userMessage() : assistantMessage(),
          sentiment: isUser
            ? faker.helpers.arrayElement([...SENTIMENTS])
            : undefined,
          confidenceScore: isUser ? undefined : faker.number.float({ min: 0.6, max: 0.99 }),
        },
      });
      messageCount++;
    }
  }
  console.log(`✓ ${messageCount} messages in ${conversationIds.length} conversations`);

  // Tracking events (600-800)
  const trackingTarget = faker.number.int({ min: 600, max: 800 });
  let trackingCount = 0;
  const locations = [...CITIES, "Lahore Hub", "Karachi Hub", "Islamabad Hub"];

  for (const order of allOrders) {
    if (trackingCount >= trackingTarget) break;
    const eventsForOrder = faker.number.int({ min: 4, max: 8 });
    const baseDate = new Date(order.orderDate);
    const types = [...TRACKING_TYPES];
    for (let e = 0; e < eventsForOrder && trackingCount < trackingTarget; e++) {
      const eventDate = new Date(baseDate);
      eventDate.setHours(eventDate.getHours() + e * faker.number.int({ min: 6, max: 24 }));
      await prisma.trackingEvent.create({
        data: {
          orderId: order.id,
          eventType: types[Math.min(e, types.length - 1)],
          status: types[Math.min(e, types.length - 1)].replace(/_/g, " "),
          location: faker.helpers.arrayElement(locations),
          description: trackingDescription(types[Math.min(e, types.length - 1)]),
          occurredAt: eventDate,
        },
      });
      trackingCount++;
    }
  }
  console.log(`✓ ${trackingCount} tracking events created`);

  // Sample AI audit logs
  for (let i = 0; i < 50; i++) {
    await prisma.aiAuditLog.create({
      data: {
        customerId: faker.helpers.arrayElement(allCustomerIds),
        toolCalled: faker.helpers.arrayElement([
          "searchKnowledgeBase",
          "getOrder",
          "trackOrder",
          "createReturnRequest",
          "createSupportTicket",
        ]),
        input: JSON.stringify({ query: aiAuditQuery() }),
        output: JSON.stringify({ success: true }),
        confidenceScore: faker.number.float({ min: 0.5, max: 0.99 }),
        success: faker.datatype.boolean({ probability: 0.9 }),
        escalated: faker.datatype.boolean({ probability: 0.1 }),
      },
    });
  }
  console.log("✓ 50 sample AI audit logs created");

  console.log("\n✅ Seed complete!");
  console.log("Demo accounts (password: Password123!):");
  console.log("  admin@techmart.pk   (ADMIN)");
  console.log("  agent@techmart.pk   (AGENT)");
  console.log("  customer@techmart.pk (CUSTOMER)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
