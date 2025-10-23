// validators/auth.validator.js
import { z } from "zod";


export const registerSchema = z.object({
  company_name: z
    .string({
      required_error: "Company name is required",
      invalid_type_error: "Company name must be a string",
    })
    .trim()
    .min(2, "Company name must be at least 2 characters long")
    .max(100, "Company name cannot exceed 100 characters")
    .regex(/^[a-zA-Z0-9\s\-\&\.\,]+$/, "Company name contains invalid characters"),

  domain: z
    .string({
      invalid_type_error: "Domain must be a string",
    })
    .trim()
    .toLowerCase()
    .regex(
      /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
      "Invalid domain format (example: example.com)"
    )
    .max(100, "Domain cannot exceed 100 characters")
    .optional(),

  plan_type: z
    .enum(["free", "basic", "pro", "enterprise"], {
      invalid_type_error: "Invalid plan type",
    })
    .default("free")
    .optional(),

  admin: z.object({
    full_name: z
      .string({
        required_error: "Full name is required",
      })
      .trim()
      .min(2, "Full name must be at least 2 characters long")
      .max(80, "Full name cannot exceed 80 characters")
      .regex(/^[a-zA-Z\s\.'-]+$/, "Full name can only contain letters and spaces"),

    email: z
      .string({
        required_error: "Email is required",
        invalid_type_error: "Email must be a string",
      })
      .trim()
      .toLowerCase()
      .email("Invalid email format")
      .max(120, "Email cannot exceed 120 characters"),

    password: z
      .string({
        required_error: "Password is required",
        invalid_type_error: "Password must be a string",
      })
      .min(8, "Password must be at least 8 characters long")
      .max(128, "Password cannot exceed 128 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[@$!%*?&#^()_\-]/, "Password must contain at least one special character"),
  }),
});


export const loginSchema = z.object({
  email: z
    .string({
      required_error: "Email is required",
      invalid_type_error: "Email must be a string",
    })
    .trim()
    .toLowerCase()
    .email("Invalid email format")
    .max(120, "Email cannot exceed 120 characters"),

  password: z
    .string({
      required_error: "Password is required",
      invalid_type_error: "Password must be a string",
    })
    .min(1, "Password cannot be empty")
    .max(128, "Password cannot exceed 128 characters"),
});


export const refreshSchema = z.object({
  refresh_token: z
    .string({
      required_error: "Refresh token is required",
      invalid_type_error: "Refresh token must be a string",
    })
    .trim()
    .min(10, "Invalid refresh token")
    .max(512, "Invalid refresh token length"),
});


// validators/tenantSchemas.ts
export const tenantPatchSchema = z.object({
  name: z
    .string({
      invalid_type_error: "Name must be a string",
    })
    .trim()
    .min(2, "Name must be at least 2 characters long")
    .max(255, "Name cannot exceed 255 characters")
    .optional(),

  domain: z
    .string({
      invalid_type_error: "Domain must be a string",
    })
    .trim()
    .toLowerCase()
    .regex(
      /^(?!:\/\/)([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,}$/,
      "Invalid domain format"
    )
    .max(255, "Domain cannot exceed 255 characters")
    .optional(),

  status: z
    .enum(["active", "suspended", "deleted"], {
      invalid_type_error: "Status must be one of: active, suspended, deleted",
    })
    .optional(),
});

// validators/policySchemas.ts
export const tenantPolicyPatchSchema = z.object({
  allow_custom_smtp: z.boolean().optional(),
  max_mailboxes: z.number().int().min(0).optional(),
  storage_limit_mb: z.number().int().min(0).optional(),
  allow_external_providers: z.boolean().optional(),
  allow_auto_sync: z.boolean().optional(),
});

// validators/userSchemas.ts
export const createUserSchema = z.object({
  email: z
    .string({
      required_error: "Email is required",
      invalid_type_error: "Email must be a string",
    })
    .trim()
    .toLowerCase()
    .email("Invalid email format")
    .max(120, "Email cannot exceed 120 characters"),

  full_name: z
    .string({
      required_error: "Full name is required",
      invalid_type_error: "Full name must be a string",
    })
    .trim()
    .min(2, "Full name must be at least 2 characters long")
    .max(100, "Full name cannot exceed 100 characters"),

  role: z
    .string({
      invalid_type_error: "Role must be a string",
    })
    .trim()
    .max(50, "Role cannot exceed 50 characters")
    .optional(),

  send_invite: z
    .boolean({
      invalid_type_error: "Send invite must be a boolean value",
    })
    .optional()
    .default(true),
});

export const updateUserSchema = z.object({
  full_name: z
    .string({
      invalid_type_error: "Full name must be a string",
    })
    .trim()
    .min(2, "Full name must be at least 2 characters long")
    .max(100, "Full name cannot exceed 100 characters")
    .optional(),

  role: z
    .string({
      invalid_type_error: "Role must be a string",
    })
    .trim()
    .max(50, "Role cannot exceed 50 characters")
    .optional(),

  status: z
    .enum(["active", "invited", "suspended", "deleted"], {
      invalid_type_error: "Invalid user status",
    })
    .optional(),

  password: z
    .string({
      invalid_type_error: "Password must be a string",
    })
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password cannot exceed 128 characters")
    .optional(),
});


// validators/roleSchemas.ts
export const createRoleSchema = z.object({
  name: z
    .string({
      required_error: "Role name is required",
      invalid_type_error: "Role name must be a string",
    })
    .trim()
    .min(2, "Role name must be at least 2 characters long")
    .max(50, "Role name cannot exceed 50 characters"),

  description: z
    .string({
      invalid_type_error: "Description must be a string",
    })
    .trim()
    .max(255, "Description cannot exceed 255 characters")
    .optional(),

  permissions: z
    .array(
      z
        .string({
          invalid_type_error: "Each permission must be a string",
        })
        .trim()
        .min(1, "Permission cannot be empty"),
    )
    .nonempty("Permissions array cannot be empty")
    .optional(),
});

export const updateRoleSchema = z.object({
  name: z
    .string({
      invalid_type_error: "Role name must be a string",
    })
    .trim()
    .min(2, "Role name must be at least 2 characters long")
    .max(50, "Role name cannot exceed 50 characters")
    .optional(),

  description: z
    .string({
      invalid_type_error: "Description must be a string",
    })
    .trim()
    .max(255, "Description cannot exceed 255 characters")
    .optional(),

  permissions: z
    .array(
      z
        .string({
          invalid_type_error: "Each permission must be a string",
        })
        .trim()
        .min(1, "Permission cannot be empty"),
    )
    .optional(),
});
