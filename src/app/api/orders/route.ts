import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { getCustomerOrders } from "@/services/order.service";
import { NextResponse } from "next/server";
import type { SessionUser } from "@/lib/rbac/permissions";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as SessionUser;
  if (!user.customerId) {
    return NextResponse.json({ error: "No customer profile" }, { status: 400 });
  }
  const orders = await getCustomerOrders(user.customerId, user);
  return NextResponse.json(
    orders.map((o) => ({ id: o.id, externalId: o.externalId, status: o.status }))
  );
}
