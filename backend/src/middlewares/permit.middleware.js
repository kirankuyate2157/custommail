import { resolveUserPermissions } from "../utils/permission.helper.js"; // implement in utils

export const permit = (requiredPermissions = []) => {
  return async (req, res, next) => {
    try {
      const userId = req.auth?.user_id;
      if (!userId) return res.status(401).json({ status: "error", message: "Unauthorized" });

      const userPermissions = await resolveUserPermissions(userId, req.auth.tenant_id);
      // wildcard
      if (userPermissions.includes("*")) return next();

      const allowed = requiredPermissions.every(p => userPermissions.includes(p));
      if (!allowed) return res.status(403).json({ status: "error", message: "Forbidden" });

      next();
    } catch (err) {
      return res.status(500).json({ status: "error", message: "Authorization error" });
    }
  };
};
