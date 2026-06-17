"use server";

import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { requireUser } from "@/lib/auth/session";
import { registerSchema, createReturnSchema, createTicketSchema } from "@/lib/validators/schemas";
import { createReturnRequest, createTicket, getCustomerReturns, getCustomerTickets } from "@/services/ticket.service";
import { updateCustomerProfile } from "@/services/customer.service";
import { approveReturn, rejectReturn, listAllReturns, listAllTickets, updateTicket } from "@/services/ticket.service";
import { listAiAuditLogs } from "@/services/audit.service";
import { revalidatePath } from "next/cache";

export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone") || undefined,
    city: formData.get("city") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (existing) return { error: "Email already registered" };

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.user.create({
    data: {
      email: parsed.data.email.toLowerCase(),
      passwordHash,
      name: parsed.data.name,
      role: "CUSTOMER",
      customer: {
        create: {
          phone: parsed.data.phone,
          city: parsed.data.city,
        },
      },
    },
  });
  return { success: true };
}

export async function createReturnAction(formData: FormData) {
  const user = await requireUser();
  if (!user.customerId) return { error: "Customer profile required" };

  const parsed = createReturnSchema.safeParse({
    orderId: formData.get("orderId"),
    reason: formData.get("reason"),
    description: formData.get("description"),
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  try {
    await createReturnRequest(user.customerId, user, parsed.data);
    revalidatePath("/returns");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create return" };
  }
}

export async function createTicketAction(formData: FormData) {
  const user = await requireUser();
  if (!user.customerId) return { error: "Customer profile required" };

  const parsed = createTicketSchema.safeParse({
    subject: formData.get("subject"),
    description: formData.get("description"),
    category: formData.get("category"),
    orderId: formData.get("orderId") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  try {
    await createTicket(user.customerId, user, parsed.data);
    revalidatePath("/tickets");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create ticket" };
  }
}

export async function updateProfileAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!user.customerId) return;

  await updateCustomerProfile(user.customerId, user, {
    phone: (formData.get("phone") as string) || undefined,
    shippingAddress: (formData.get("shippingAddress") as string) || undefined,
    city: (formData.get("city") as string) || undefined,
    province: (formData.get("province") as string) || undefined,
    postalCode: (formData.get("postalCode") as string) || undefined,
  });
  revalidatePath("/profile");
}

export async function approveReturnAction(returnId: string): Promise<void> {
  const user = await requireUser();
  try {
    await approveReturn(returnId, user);
    revalidatePath("/admin/returns");
  } catch {
    // logged silently for MVP
  }
}

export async function rejectReturnAction(returnId: string, reason: string): Promise<void> {
  const user = await requireUser();
  try {
    await rejectReturn(returnId, user, reason);
    revalidatePath("/admin/returns");
  } catch {
    // logged silently for MVP
  }
}

export async function updateTicketAction(
  ticketId: string,
  data: { status?: string; priority?: string }
): Promise<void> {
  const user = await requireUser();
  try {
    await updateTicket(ticketId, user, data as never);
    revalidatePath("/admin/tickets");
  } catch {
    // logged silently for MVP
  }
}

export async function createStaffUserAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (user.role !== "ADMIN") return;

  const email = (formData.get("email") as string)?.toLowerCase();
  const name = formData.get("name") as string;
  const role = formData.get("role") as "AGENT" | "ADMIN";
  const password = formData.get("password") as string;

  if (!email || !name || !password) return;

  const passwordHash = await hashPassword(password);
  await prisma.user.create({
    data: { email, name, passwordHash, role },
  });
  revalidatePath("/admin/users");
}

export { getCustomerReturns, getCustomerTickets, listAllReturns, listAllTickets, listAiAuditLogs };
