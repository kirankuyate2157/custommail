import { Router } from "express";
import * as controller from "../controllers/user.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { permit } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { roleAssignmentSchema } from "../validators/user.validator.js";

const router = Router();

router.post("/create", authenticate, controller.create);
router.get("/me", authenticate, controller.me);

router.get("/", authenticate,  controller.list);
router.get("/:id", authenticate, permit("admin", "owner"), controller.getOne);
router.put("/:id", authenticate, permit("admin", "owner", "member"), controller.update);
router.delete("/:id", authenticate, permit("admin", "owner"), controller.remove);

/**
 * Role management
 */

// Get roles assigned to a user (optionally by tenant)
router.get("/:user_id/roles", authenticate, permit("admin", "owner"), controller.getUserRoles);

// Assign a role to a user in a tenant
router.post(
  "/:user_id/roles",
  authenticate,
  permit("admin", "owner"),
  validate(roleAssignmentSchema),
  controller.assignRoleToUser
);

// Remove a role from a user in a tenant
router.delete(
  "/:user_id/roles/:role_id",
  authenticate,
  permit("admin", "owner"),
  controller.removeRoleFromUser
);

/**
 * Get effective permissions for a user in a tenant
 */
router.get(
  "/:user_id/permissions",
  authenticate,
  permit("admin", "owner", "member"),
  controller.getUserPermissions
);

export default router;
