import { faker } from "@faker-js/faker";

export const TRACKING_DESCRIPTIONS: Record<string, string[]> = {
  ORDER_PLACED: [
    "Order received and confirmed at TechMart Lahore warehouse.",
    "Payment verified. Order queued for processing.",
    "Your order has been placed successfully.",
  ],
  PROCESSING: [
    "Item picked and packed at our Lahore fulfillment center.",
    "Quality check completed. Preparing for courier pickup.",
    "Order is being prepared for shipment.",
  ],
  SHIPPED: [
    "Handed over to courier partner for delivery.",
    "Package dispatched from Lahore hub.",
    "Shipment created. Tracking active with courier.",
  ],
  IN_TRANSIT: [
    "Package in transit to your city.",
    "Shipment moving between courier hubs.",
    "On the way to the local delivery station.",
  ],
  OUT_FOR_DELIVERY: [
    "Courier is out for delivery today.",
    "Rider assigned. Expect delivery today.",
    "Package loaded on delivery vehicle.",
  ],
  DELIVERED: [
    "Package delivered successfully.",
    "Order delivered to the shipping address.",
    "Customer received the package.",
  ],
  DELAYED: [
    "Delivery delayed due to weather conditions.",
    "Slight delay at courier hub. We apologize for the inconvenience.",
    "Shipment held temporarily. Updated ETA will be shared soon.",
  ],
  OTHER: [
    "Shipment status updated.",
    "Tracking information refreshed by courier.",
  ],
};

export const RETURN_DESCRIPTIONS = [
  "Product arrived with a cracked screen. Requesting return and refund.",
  "Item does not match what I ordered. Wrong model received.",
  "Laptop overheats within minutes of use. Seems defective.",
  "Package was damaged on arrival. Product box was torn open.",
  "Changed my mind — product is unused and in original packaging.",
  "Headphones have audio issues on the left side.",
  "Received an empty box. Courier seal was broken.",
  "Product stopped working after two days. Warranty claim needed.",
];

export const TICKET_DESCRIPTIONS = [
  "I placed an order last week but tracking has not updated since shipment.",
  "My COD order was marked delivered but I never received the package.",
  "I need help starting a return for a damaged smartphone.",
  "Refund for my approved return has not appeared in my JazzCash wallet.",
  "Warranty claim for laptop keyboard keys not working properly.",
  "Courier attempted delivery when I was not home. Need redelivery.",
  "I was charged twice for the same order on my card.",
  "Product listing showed 8GB RAM but I received 4GB variant.",
];

export const USER_MESSAGES = [
  "Hi, I need help tracking my recent order.",
  "My package shows delivered but I did not receive it.",
  "Can I return this item? It arrived damaged.",
  "What is your return policy for electronics?",
  "How long does refund take after return approval?",
  "I want to speak to a human about my refund.",
  "Is free shipping available for orders above PKR 5,000?",
  "My tracking number is not updating on the courier website.",
  "Can you check the status of order PK-ORD-10001?",
  "The laptop I received has a dent on the corner.",
];

export const ASSISTANT_MESSAGES = [
  "I'd be happy to help you with that. Let me look up your order details.",
  "Based on our return policy, electronics can be returned within 7 days of delivery.",
  "I've found your order. It is currently in transit via TCS to Lahore.",
  "I've created a pending return request. Our team will review it within 24 hours.",
  "Refunds are processed in PKR to your original payment method within 5–7 business days after inspection.",
  "Your shipment was handed to Leopards Courier yesterday from our Islamabad hub.",
  "I understand your frustration. Let me escalate this to our support team.",
  "Free standard shipping applies to orders above PKR 5,000 across Pakistan.",
  "Please share your order number so I can verify ownership before proceeding.",
  "Is there anything else I can help you with today?",
];

export const AI_AUDIT_QUERIES = [
  "return policy electronics",
  "track order PK-ORD-10042",
  "refund processing time",
  "free shipping threshold PKR",
  "warranty laptop Pakistan",
  "COD refund method",
  "courier TCS delivery time",
  "damaged item return process",
];

export function pick<T>(items: T[]): T {
  return faker.helpers.arrayElement(items);
}

export function trackingDescription(eventType: string): string {
  const list = TRACKING_DESCRIPTIONS[eventType] ?? TRACKING_DESCRIPTIONS.OTHER;
  return pick(list);
}

export function returnDescription(): string {
  return pick(RETURN_DESCRIPTIONS);
}

export function ticketDescription(): string {
  return pick(TICKET_DESCRIPTIONS);
}

export function userMessage(): string {
  return pick(USER_MESSAGES);
}

export function assistantMessage(): string {
  return pick(ASSISTANT_MESSAGES);
}

export function aiAuditQuery(): string {
  return pick(AI_AUDIT_QUERIES);
}
