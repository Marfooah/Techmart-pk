import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  city: z.string().optional(),
});

export const createReturnSchema = z.object({
  orderId: z.string().min(1),
  reason: z.enum([
    "DAMAGED",
    "DEFECTIVE",
    "WRONG_ITEM",
    "NOT_AS_DESCRIBED",
    "CHANGED_MIND",
    "OTHER",
  ]),
  description: z.string().min(10),
});

export const createTicketSchema = z.object({
  subject: z.string().min(5),
  description: z.string().min(10),
  category: z.enum([
    "ORDER",
    "SHIPPING",
    "RETURN",
    "REFUND",
    "WARRANTY",
    "PRODUCT",
    "ACCOUNT",
    "OTHER",
  ]),
  orderId: z.string().optional(),
});

export const chatSchema = z.object({
  message: z.string().min(1).max(4000),
  conversationId: z.string().optional(),
});
