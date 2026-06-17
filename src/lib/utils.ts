import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPKR(amount: number): string {
  return `PKR ${amount.toLocaleString("en-PK")}`;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function generateTicketNumber(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `TKT-${num}`;
}

export function mapOrderStatus(status: string): string {
  const normalized = status.toUpperCase().replace(/\s+/g, "_");
  const valid = [
    "PENDING",
    "PROCESSING",
    "SHIPPED",
    "IN_TRANSIT",
    "DELIVERED",
    "CANCELLED",
    "RETURNED",
  ];
  if (valid.includes(normalized)) return normalized;
  if (status.toLowerCase().includes("deliver")) return "DELIVERED";
  if (status.toLowerCase().includes("ship")) return "SHIPPED";
  if (status.toLowerCase().includes("cancel")) return "CANCELLED";
  return "PROCESSING";
}

export function mapPaymentMethod(method: string): string {
  const m = method.toLowerCase();
  if (m.includes("cod") || m.includes("cash")) return "COD";
  if (m.includes("card")) return "CARD";
  if (m.includes("bank")) return "BANK_TRANSFER";
  if (m.includes("jazz") || m.includes("easy") || m.includes("wallet")) return "WALLET";
  return "OTHER";
}
