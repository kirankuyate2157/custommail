// src/app.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import sessionRoutes from "./routes/session.routes.js";
import userRoutes from "./routes/user.routes.js";
import { apiRateLimiter } from "./middlewares/rateLimit.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { swaggerDocument } from "./docs/swagger/index.js";
import  swaggerUi  from 'swagger-ui-express';
import log from "./config/logger.js";


const app = express();
app.use(cookieParser());

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(apiRateLimiter);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));


// Register routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/sessions", sessionRoutes);

app.use((err, req, res, next) => {
  log.raw(err);
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Internal server error",
  });
});

// Root endpoint
app.get("/", (req, res) => res.send("RBAC Backend"));

// Error handler (must be last)
app.use(errorHandler);

export default app;
