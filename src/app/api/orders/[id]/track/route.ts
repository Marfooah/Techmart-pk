import { trackOrder } from "@/services/order.service";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { getServerSession } = await import("next-auth");
  const { authOptions } = await import("@/lib/auth/auth");
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as import("@/lib/rbac/permissions").SessionUser;
  const { id } = await params;

  const result = await trackOrder(id, user);
  if (!result) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
