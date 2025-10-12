// src/types/express.d.js
import type { User } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: Partial<User> & { id: string; tenantId?: string; role?: string };
    }
  }
}

export {};
