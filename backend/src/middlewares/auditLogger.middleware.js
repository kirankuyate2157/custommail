import prisma from "../config/db";

/**
 * Fire-and-forget audit logger middleware.
 * Logs API calls with user, tenant, route, method, payload, status, duration.
 *
 * Usage: app.get("/endpoint", auditLogger("USER_CREATE"), handler)
 *
 * @param {string} action - Custom action name for the audit entry
 * @returns Express middleware
 */
export const auditLogger = (action) => {
  return async (req, res, next) => {
    const startTime = Date.now();

    // intercept response to log after sending
    const originalSend = res.send.bind(res);
    res.send = async (body) => {
      try {
        const actorUserId = req.auth?.userId ?? null;
        const tenantId = req.tenantId ?? req.auth?.tenantId ?? null;

        const entry = {
          tenant_id: tenantId,
          user_id: actorUserId,
          action,
          details: {
            route: req.originalUrl,
            method: req.method,
            statusCode: res.statusCode,
            durationMs: Date.now() - startTime,
            payload: {
              params: req.params,
              query: req.query,
              body: req.body,
            },
          },
        };

        // Fire-and-forget; log errors but don't block response
        prisma.auditLog
          .create({ data: entry })
          .catch((err) => console.error("[Audit Logger] Error creating log:", err));
      } finally {
        return originalSend(body);
      }
    };

    next();
  };
};

/**
 * Utility function to write ad-hoc audit logs from anywhere in the server
 */
export const writeAudit = async ({ tenantId, userId, action, details }) => {
  try {
    await prisma.auditLog.create({
      data: {
        tenant_id: tenantId,
        user_id: userId,
        action,
        details,
      },
    });
  } catch (err) {
    console.error("[Audit Logger] Failed to write audit:", err);
  }
};