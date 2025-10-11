// user routes
import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", authMiddleware, userController.getUsers);
router.post("/", authMiddleware, userController.createUser);

export default router;
