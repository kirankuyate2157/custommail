import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { permit } from "../middlewares/permit.middleware.js";
import * as RoleController from "../controllers/role.controller.js";

const router = Router();

router.get("/", authenticate, permit(["roles.view"]), RoleController.listRoles);
router.post("/", authenticate, permit(["roles.create"]), RoleController.createRole);
router.post("/:id/permissions", authenticate, permit(["roles.update"]), RoleController.addPermissions);

export default router;
