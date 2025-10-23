export const authSchemas = {
  Register: {
    type: "object",
    required: ["company_name", "admin"],
    properties: {
      company_name: { type: "string", example: "kk Corp" },
      domain: { type: "string", example: "kk.com" },
      plan_type: { type: "string", example: "enterprise" },
      admin: {
        type: "object",
        required: ["full_name", "email", "password"],
        properties: {
          full_name: { type: "string", example: "Karan Arajun" },
          email: { type: "string", example: "admin@kk.com" },
          password: { type: "string", example: "Password123!" },
        },
      },
    },
  },

  Login: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", example: "admin@kk.com" },
      password: { type: "string", example: "Password123!" },
    },
  },

  Refresh: {
    type: "object",
    // required: ["refresh_token"],
    // properties: {
    //   refresh_token: { type: "string", example: "eyJhbGciOiJI..." },
    // },
  },

  TokenResponse: {
    type: "object",
    properties: {
      access_token: { type: "string", example: "eyJhbGciOiJI..." },
      refresh_token: { type: "string", example: "eyJhbGciOiJI..." },
    },
  },

  UserResponse: {
    type: "object",
    properties: {
      id: { type: "string", example: "uuid-1234" },
      email: { type: "string", example: "admin@kk.com" },
      full_name: { type: "string", example: "John Doe" },
    },
  },
};

export const authPaths = {
  "/api/v1/auth/register": {
    post: {
      tags: ["Auth"],
      summary: "Register a new tenant with admin",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Register" },
          },
        },
      },
      responses: {
        201: { description: "Tenant registered successfully" },
        400: { description: "Validation error" },
        409: { description: "Email already registered" },
      },
    },
  },

  "/api/v1/auth/login": {
    post: {
      tags: ["Auth"],
      summary: "Login user and generate tokens",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Login" },
          },
        },
      },
      responses: {
        200: {
          description: "Logged in successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TokenResponse" },
            },
          },
        },
        400: { description: "Validation error" },
        401: { description: "Invalid credentials" },
      },
    },
  },

  "/api/v1/auth/refresh": {
    get: {
      tags: ["Auth"],
      summary: "Refresh access token using refresh token",
      // requestBody: {
      //   required: true,
      //   content: {
      //     "application/json": {
      //       schema: { $ref: "#/components/schemas/Refresh" },
      //     },
      //   },
      // },
      responses: {
        200: {
          description: "Tokens refreshed",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TokenResponse" },
            },
          },
        },
        400: { description: "Validation error" },
        401: { description: "Invalid or expired refresh token" },
      },
    },
  },

  "/api/v1/auth/logout": {
    post: {
      tags: ["Auth"],
      summary: "Logout from current device",
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: "Logged out successfully" },
        401: { description: "Unauthorized" },
      },
    },
  },

  "/api/v1/auth/logout-all": {
  "post": {
    "tags": ["Auth"],
    "summary": "Logout from all devices",
    "description": "Logs the user out from all active devices or optionally all other devices except the current one. This endpoint invalidates all active sessions in the database and clears authentication cookies.",
    "security": [{ "bearerAuth": [] }],
    "parameters": [
      {
        "in": "query",
        "name": "mode",
        "required": false,
        "schema": {
          "type": "string",
          "enum": ["all", "others"],
          "default": "all"
        },
        "description": "Specify 'all' to logout from every device, or 'others' to logout from all devices except the current session."
      }
    ],
    "responses": {
      "200": {
        "description": "Logout successful",
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "status": { "type": "string", "example": "success" },
                "message": {
                  "type": "string",
                  "example": "Logged out from all devices"
                }
              }
            }
          }
        }
      },
      "401": {
        "description": "Unauthorized - Missing or invalid token"
      },
      "500": {
        "description": "Internal server error"
      }
    }
  }
}

};
