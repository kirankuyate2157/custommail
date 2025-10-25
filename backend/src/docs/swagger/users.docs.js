export const userSchemas = {
  CreateUserDto: {
    type: "object",
    required: ["email", "password", "full_name"],
    properties: {
      full_name: { type: "string", example: "John Doe" },
      email: { type: "string", format: "email", example: "john@example.com" },
      password: { type: "string", example: "Secret123!" },
      role: { type: "string", enum: ["member", "admin", "owner"], example: "member" },
      tenant_id: { type: "string", format: "uuid", example: "7a303fd2-6d38-4647-9fc9-78613b698738" },
    },
  },
  UpdateUserDto: {
    type: "object",
    properties: {
      full_name: { type: "string" },
      email: { type: "string", format: "email" },
      password: { type: "string" },
      role: { type: "string", enum: ["user", "member", "admin", "owner"] },
      status: { type: "string", enum: ["active", "inactive"] },
    },
  },
  LoginDto: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", format: "email", example: "john@example.com" },
      password: { type: "string", example: "Secret123!" },
    },
  },
  UserResponse: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      full_name: { type: "string" },
      email: { type: "string", format: "email" },
      role: { type: "string" },
      tenantId: { type: "string", format: "uuid" },
      status: { type: "string" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  UserOrgMap: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      user_id: { type: "string", format: "uuid" },
      tenant_id: { type: "string", format: "uuid" },
      role_id: { type: "string", format: "uuid" },
      role_in_org: { type: "string", example: "admin" },
      created_at: { type: "string", format: "date-time" },
    },
  },
};

export const userPaths = {
  "/api/v1/users/create": {
    post: {
      tags: ["Users"],
      summary: "Create a new user",
      requestBody: {
        required: true,
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/CreateUserDto" } },
        },
      },
      responses: {
        201: { description: "User created successfully", content: { "application/json": { schema: { $ref: "#/components/schemas/UserResponse" } } } },
        400: { description: "User already exists or invalid input" },
      },
    },
  },

  "/api/v1/users/me": {
    get: {
      tags: ["Users"],
      summary: "Get authenticated user info",
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: "Authenticated user", content: { "application/json": { schema: { $ref: "#/components/schemas/UserResponse" } } } },
        401: { description: "Unauthenticated" },
      },
    },
  },

  "/api/v1/users": {
    get: {
      tags: ["Users"],
      summary: "Get list of users",
      description:
        "Retrieve a paginated, searchable, and sortable list of users. Supports filtering by tenant and searching by `user_id`, `username`, `full_name`, or `email`.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "tenant_id",
          in: "query",
          required: false,
          schema: { type: "string", format: "uuid" },
          description: "Filter users belonging to a specific tenant",
        },
        {
          name: "is_all",
          in: "query",
          required: false,
          schema: { type: "boolean", default: false },
          description: " tenant specific scope or all global user ",
          example: false,
        },
        {
          name: "search",
          in: "query",
          required: false,
          schema: { type: "string" },
          description:
            "Search users by `user_id`, `username`, `full_name`, or `email` (case-insensitive)",
          example: "",
        },
        {
          name: "page",
          in: "query",
          required: false,
          schema: { type: "integer", default: 1, minimum: 1 },
          description: "Page number (default 1)",
          example: 1,
        },
        {
          name: "limit",
          in: "query",
          required: false,
          schema: { type: "integer", default: 20, maximum: 100 },
          description: "Number of users per page (default 20, max 100)",
          example: 20,
        },
        {
          name: "orderBy",
          in: "query",
          required: false,
          schema: { type: "string", enum: ["created_at", "updated_at", "full_name", "email", "role"] },
          description: "Field to sort by (default: created_at)",
          example: "full_name",
        },
        {
          name: "order",
          in: "query",
          required: false,
          schema: { type: "string", enum: ["asc", "desc"], default: "desc" },
          description: "Sort direction (ascending or descending)",
          example: "asc",
        },
      ],
      responses: {
        200: {
          description: "Paginated list of users",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "success" },
                  message: { type: "string", example: "Users fetched successfully" },
                  pagination: {
                    type: "object",
                    properties: {
                      total: { type: "integer", example: 154 },
                      page: { type: "integer", example: 1 },
                      limit: { type: "integer", example: 20 },
                      totalPages: { type: "integer", example: 8 },
                    },
                  },
                  data: {
                    type: "array",
                    items: { $ref: "#/components/schemas/UserResponse" },
                  },
                },
              },
            },
          },
        },
        400: { description: "Invalid query parameters" },
        401: { description: "Unauthorized access" },
        500: { description: "Internal server error" },
      },
    },
  },

  "/api/v1/users/{id}": {
    get: {
      tags: ["Users"],
      summary: "Get user by ID",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      responses: {
        200: { description: "User object", content: { "application/json": { schema: { $ref: "#/components/schemas/UserResponse" } } } },
        404: { description: "User not found" },
      },
    },
    put: {
      tags: ["Users"],
      summary: "Update user by ID",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateUserDto" } } } },
      responses: {
        200: { description: "User updated", content: { "application/json": { schema: { $ref: "#/components/schemas/UserResponse" } } } },
        404: { description: "User not found" },
      },
    },
    delete: {
      tags: ["Users"],
      summary: "Delete user by ID",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      responses: { 204: { description: "User deleted" }, 404: { description: "User not found" } },
    },
  },

  "/api/v1/v1/users/{user_id}/roles": {
    get: {
      tags: ["Users"],
      summary: "Get roles assigned to a user",
      parameters: [
        { name: "user_id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        { name: "tenant_id", in: "query", schema: { type: "string", format: "uuid" }, description: "Filter by tenant" },
      ],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "List of user roles",
          content: { "application/json": { schema: { type: "object", properties: { status: { type: "string" }, data: { type: "array", items: { $ref: "#/components/schemas/UserOrgMap" } } } } } },
        },
      },
    },
    post: {
      tags: ["Users"],
      summary: "Assign role to user",
      parameters: [{ name: "user_id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { type: "object", required: ["role_id", "tenant_id"], properties: { role_id: { type: "string", format: "uuid" }, tenant_id: { type: "string", format: "uuid" }, role_in_org: { type: "string", example: "manager" } } } } },
      },
      responses: {
        201: { description: "Role assigned successfully", content: { "application/json": { schema: { type: "object", properties: { status: { type: "string" }, message: { type: "string" }, data: { $ref: "#/components/schemas/UserOrgMap" } } } } } },
        400: { description: "Invalid input" },
        404: { description: "User not found" },
      },
    },
  },

  "/api/v1/v1/users/{user_id}/roles/{role_id}": {
    delete: {
      tags: ["Users"],
      summary: "Remove role from user",
      parameters: [
        { name: "user_id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        { name: "role_id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        { name: "tenant_id", in: "query", schema: { type: "string", format: "uuid" } },
      ],
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: "Role removed", content: { "application/json": { schema: { type: "object", properties: { status: { type: "string" }, message: { type: "string" } } } } } },
        404: { description: "Mapping not found" },
      },
    },
  },

  "/api/v1/v1/users/{user_id}/permissions": {
    get: {
      tags: ["Users"],
      summary: "Get effective permissions for user",
      parameters: [
        { name: "user_id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        { name: "tenant_id", in: "query", required: true, schema: { type: "string", format: "uuid" } },
      ],
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: "List of effective permissions", content: { "application/json": { schema: { type: "object", properties: { status: { type: "string" }, data: { type: "array", items: { type: "string" } } } } } } },
      },
    },
  },
};
