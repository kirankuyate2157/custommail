// src/validators/user.validator.js
import { z } from "zod";

// Roles allowed
const roles = [ "member", "admin", "owner"];

export const registerSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(6, "Password must be at least 6 characters")
    .max(50, "Password too long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[\W_]/, "Password must contain at least one special character"),
  role: z.enum(roles).optional(),
  tenant_id: z.string().uuid().optional(),
});

export const loginSchema = z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "password_hash required"),
});

export const updateUserSchema = z.object({
    full_name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    password_hash: z.string()
        .min(6)
        .max(50)
        .regex(/[A-Z]/, "password_hash must contain at least one uppercase letter")
        .regex(/[a-z]/, "password_hash must contain at least one lowercase letter")
        .regex(/[0-9]/, "password_hash must contain at least one number")
        .regex(/[\W_]/, "password_hash must contain at least one special character")
        .optional(),
    role: z.enum(roles).optional(),
    status: z.enum(["active", "inactive"]).optional(),
});



/**
 * ✅ Role assignment validation
 * Used for POST /users/:user_id/roles
 */
export const roleAssignmentSchema = z.object({
  role_id: z.string().uuid({ message: "Valid role_id is required" }),
  tenant_id: z.string().uuid({ message: "Valid tenant_id is required" }),
  role_in_org: z
    .string()
    .min(1, "role_in_org must not be empty")
    .max(50, "role_in_org too long")
    .optional(),
});

/**
 * ✅ Optional validator for removing roles
 * Used for DELETE /users/:user_id/roles/:role_id
 */
export const removeRoleSchema = z.object({
  tenant_id: z
    .string()
    .uuid({ message: "Valid tenant_id is required" })
    .optional(),
});

/**
 * ✅ Optional validator for query filters
 * Used for GET /users/:user_id/permissions
 */
export const userPermissionQuerySchema = z.object({
  tenant_id: z
    .string()
    .uuid({ message: "Valid tenant_id is required" })
    .optional(),
});