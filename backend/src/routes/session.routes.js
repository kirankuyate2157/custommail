// src/routes/session.routes.js
import { Router } from "express";
import {
    refreshSession,
    revokeSession,
    getAllSessions,
    getSessionLogs,

} from "../controllers/session.controller.js";

import { authenticate } from "../middlewares/auth.middleware.js";
import { permit } from "../middlewares/role.middleware.js";

export const sessionRouter = Router();
// Get all sessions (with filters)
sessionRouter.get("/", authenticate, getAllSessions);

// Revoke a specific session
sessionRouter.post("/revoke/:id", authenticate, revokeSession);

sessionRouter.post("/refresh", authenticate, refreshSession);
// Get session logs
sessionRouter.get("/logs", authenticate, getSessionLogs);

export default sessionRouter;


