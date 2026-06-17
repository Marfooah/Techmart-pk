import type { DefaultSession } from "next-auth";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      customerId?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: Role;
    customerId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    customerId?: string;
  }
}

export type ToolContext = {
  userId: string;
  customerId: string;
  conversationId: string;
  isAI: boolean;
};

export type ChatResponse = {
  message: string;
  conversationId: string;
  confidence: number;
  escalated: boolean;
  sentiment: string;
};
