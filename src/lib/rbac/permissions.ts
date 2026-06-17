import type { Role } from "@prisma/client";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  customerId?: string;
};

export const PERMISSIONS = {
  VIEW_OWN_ORDERS: ["CUSTOMER"],
  VIEW_ALL_ORDERS: ["ADMIN", "AGENT"],
  CREATE_RETURN: ["CUSTOMER", "ADMIN"],
  APPROVE_RETURN: ["ADMIN"],
  CREATE_TICKET: ["CUSTOMER", "ADMIN", "AGENT"],
  AI_CHAT: ["CUSTOMER"],
  VIEW_AI_AUDIT: ["ADMIN"],
  MANAGE_USERS: ["ADMIN"],
  MANAGE_TICKETS: ["ADMIN", "AGENT"],
} as const;

export function hasRole(user: SessionUser, roles: Role[]): boolean {
  return roles.includes(user.role);
}

export function requireRole(user: SessionUser | null | undefined, roles: Role[]): void {
  if (!user) throw new Error("Unauthorized");
  if (!hasRole(user, roles)) throw new Error("Forbidden");
}

export function assertCustomerOwnership(
  user: SessionUser,
  customerId: string
): void {
  if (user.role === "ADMIN" || user.role === "AGENT") return;
  if (user.customerId !== customerId) throw new Error("Forbidden: access denied");
}
