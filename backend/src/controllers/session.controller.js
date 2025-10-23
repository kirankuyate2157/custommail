import { SessionService } from "../services/session.service.js";
import { log } from "../config/logger.js";

/**
 * Refresh a session (extend expiry)
 */
export const refreshSession = async (req, res) => {
    try {
        const { session_id } = req.body;
        const session = await SessionService.refreshSession(session_id);

        return res.status(200).json({
            status: "success",
            data: session,
            message: "Session refreshed successfully",
        });
    } catch (err) {
        log.error("Session refresh failed:", err);
        return res.status(err.status || 500).json({
            status: "error",
            message: err.message || "Internal server error",
        });
    }
};

/**
 * Revoke a single session (logout)
 */
export const revokeSession = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.auth?.user_id;
        const session = await SessionService.deactivateSession(id);

        return res.status(200).json({
            status: "success",
            data: session,
            message: "Session revoked successfully",
        });
    } catch (err) {
        log.error("Session revoke failed:", err);
        return res.status(err.status || 500).json({
            status: "error",
            message: err.message || "Internal server error",
        });
    }
};


/**
 * List all active sessions for a user (optional admin or self view)
 */
export const getAllSessions = async (req, res) => {
    try {
        const {
            user_id,
            session_id,
            tenant_id,
            search,      // can be username, email, etc.
            status = null,      // active/inactive
            page = 1,
            limit = 10,
        } = req.query;

        const result = await SessionService.getAllSessions({
            user_id,
            session_id,
            tenant_id,
            search,
            status,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
        });

        return res.json({
            status: "success",
            data: result.sessions,
            pagination: result.pagination,
        });
    } catch (error) {
        log.raw("Error fetching sessions:", error);
        return res
            .status(500)
            .json({ status: "error", message: "Internal server error" });
    }
};


/**
 * List session logs with filters and pagination
 */
export const getSessionLogs = async (req, res) => {
  try {
    const {
      user_id,
      session_id,
      tenant_id,
      search,     // username or email
      action,     // optional: logout, login, refresh etc.
      page = 1,
      limit = 10,
    } = req.query;

    const result = await SessionService.getSessionLogs({
      user_id,
      session_id,
      tenant_id,
      search,
      action,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });

    return res.json({
      status: "success",
      data: result.logs,
      pagination: result.pagination,
    });
  } catch (err) {
    log.raw("Error fetching session logs:", err);
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
};