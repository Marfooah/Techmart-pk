import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { chatSchema } from "@/lib/validators/schemas";
import { runChatAgent } from "@/ai/orchestrator";
import type { SessionUser } from "@/lib/rbac/permissions";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as SessionUser;
  if (user.role !== "CUSTOMER" || !user.customerId) {
    return NextResponse.json({ error: "AI chat is for customers only" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  try {
    const result = await runChatAgent(
      user,
      parsed.data.message,
      parsed.data.conversationId
    );
    return NextResponse.json(result);
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Chat failed" },
      { status: 500 }
    );
  }
}
