// src/middlewares/auth.middleware.js
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";
import { db } from "../config/db.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const raw = req.headers.authorization?.split(" ")[1];
    if (!raw) return res.status(401).json({ message: "Missing token" });

    const payload = jwt.verify(raw, JWT_SECRET);

    // attach minimal user info to req.user
    const user = await db.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(401).json({ message: "Invalid token" });

    req.user = { id: user.id, tenantId: user.tenantId, role: user.role };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
