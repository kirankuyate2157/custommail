import { z } from "zod";

export const createRoleSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    permissions: z.array(z.string()).optional()
  })
});
