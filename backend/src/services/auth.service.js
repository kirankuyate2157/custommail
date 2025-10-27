// src/services/auth.service.js
import { authRepository } from "../repositories/auth.repository.js";
import { hashPassword, verifyPassword, signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/auth.js";
import prisma from "../config/db.js";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import log from "../config/logger.js";
import { emailService } from "./email.service.js";
import { writeAudit } from "../middlewares/auditLogger.middleware.js";
import { SessionRepository } from "../repositories/session.repository.js";
import { seedDefaultRoles } from "../seeds/seedRolesPermissions.js";

export const authService = {
    async registerTenant(data, req) {
        const { company_name, domain, plan_type, admin } = data;
        const [existingUser, existingTenantDomain] = await Promise.all([
            authRepository.findUserByEmail(admin.email),
            domain ? authRepository.findTenantByDomain(domain) : null
        ]);

        if (existingUser) throw { status: 409, message: "Email already registered" };
        if (existingTenantDomain) throw { status: 409, message: "Domain already registered" };

        const tenant_id = uuidv4();
        const passwordHash = hashPassword(admin.password);

        const { tenant, user } = await prisma.$transaction(async (tx) => {
            const tenant = await authRepository.createTenant(tx, tenant_id, company_name, domain, plan_type);
            const user = await authRepository.createUser(tx, tenant_id, admin.email, admin.full_name, passwordHash);
            await authRepository.updateTenant(tx, tenant_id, { default_admin_user_id: user.user_id })
            // await authRepository.mapUserToTenant(tx, tenant.id, user.user_id);
            await authRepository.createDefaultPolicy(tx, tenant.id);
            await authRepository.createDefaultPermissionsIfNotExist(tx);
            await seedDefaultRoles(tenant.id, tx);  
            await authRepository.createDefaultRolesAndPermissions(tx, tenant.id, user.user_id);
           
            return { tenant, user };
        });

        // Audit + background welcome email
        Promise.all([
            writeAudit({
                tenantId: tenant.id,
                userId: user.user_id,
                module: "tenant_mgmt",
                action: "CREATE",
                target_type: "Tenant",
                description: `Tenant "${company_name}" created`,
                metadata: { route: "/auth/register", ip: req?.ip }
            }),
            writeAudit({
                tenantId: tenant.id,
                userId: user.user_id,
                module: "user_mgmt",
                action: "CREATE",
                target_type: "User",
                description: `Admin user "${user.email}" created for tenant`,
                metadata: { route: "/auth/register", ip: req?.ip }
            })
        ]).catch((err) => log.error("Audit log error:", err));

        emailService.queueEmail({
            tenant_id: tenant.id,
            user_id: user.user_id,
            to: user.email,
            subject: "Welcome to K-RBAC!",
            body: `Hello ${user.full_name || "Admin"},\n\nYour tenant "${company_name}" has been created successfully.\n\nPlan: ${plan_type || "N/A"}\nDomain: ${domain || "N/A"}\n\nThank you for joining us!\n\n– Kways Team`
        }).catch((err) => log.error("Email queue error:", err));

        return {
            tenant_id: tenant.id,
            user: { id: user.user_id, email: user.email },
        };
    },

    async loginUser({ email, password }, req) {
        const user = await authRepository.findUserByEmail(email);

        // Helper to log attempts
        const logAttempt = async ({ success, reason, session_id = null }) => {
            await authRepository.logSessionAttempt({
                session_id,
                event: "login_attempt",
                details: {
                    emailAttempt: email,
                    success,
                    reason,
                    user_id: user?.id || null,
                },
                req
            });
        };

        if (!user) {
            await logAttempt({ success: false, reason: "no_user" });
            throw { status: 401, message: "Invalid credentials" };
        }
        if (!verifyPassword(password, user.password_hash)) {
            await logAttempt({ success: false, reason: "bad_password" });
            throw { status: 401, message: "Invalid credentials" };
        }

        if (user.status !== "active") {
            await logAttempt({ success: false, reason: "inactive_user_attempting_to_login" });
            throw { status: 403, message: "User inactive" };
        }

        // Get tenant mapping
        const mapping = await authRepository.getUserTenant(user.user_id);
        const tenant_id = mapping?.tenant_id ?? null;

        await authRepository.updateLastLogin(user.user_id);
        // Log successful login with session ID
        await logAttempt({ success: true, reason: "logged_successfully", });

        // Audit login
        writeAudit({
            tenantId: tenant_id,
            userId: user.user_id,
            module: "user_mgmt",
            action: "LOGIN",
            target_type: "User",
            description: `User "${user.email}" logged in`,
            metadata: { route: "/auth/login", ip: req.ip }
        }).catch(log.error);

        return {
            tenant_id: tenant_id,
            user: { id: user.user_id, full_name: user.full_name, email: user.email },
        };
    },


    async refreshToken({ refresh_token, req }) {
        try {
            const payload = verifyRefreshToken(refresh_token);
            const user = await authRepository.findUserById(payload.user_id);
            const session = await SessionRepository.findById(payload?.session_id)
            if (!user) throw new Error("Invalid refresh token");
            if (payload.token_version !== session.token_version) throw new Error("Token revoked");

            const newAccess = signAccessToken({ user_id: user.user_id, tenant_id: payload.tenant_id, session_id: session.id, token_version: session.token_version });

            await SessionRepository.logEvent({
                session_id: payload.session_id,
                event: "session.refreshed",
                details: { user_id: user.user_id, ip: req.ip, user_agent: req.headers["user-agent"] }
            }, req);

            return { access_token: newAccess, refresh_token };
        } catch (err) {
            console.log(err)
            throw { status: 401, message: "Invalid or expired refresh token" };
        }
    },

    logout: async ({ user_id, session_id, req = null }) => {
        await authRepository.revokeSession(session_id, user_id);
        await authRepository.logEvent({
            session_id,                // optional, can be null if session not found
            user_id,                   // optional scalar
            event: "logout",
            provider: "local",         // optional, can pass auth provider
            ip_address: req?.ip || null,
            user_agent: req?.headers["user-agent"] || null,
            details: { reason: "manual logout", user_id },
        });

        writeAudit({
            tenantId: req.auth.tenant_id,
            userId: user_id,
            module: "user_mgmt",
            action: "LOGOUT",
            target_type: "session",
            target_id: session_id,
            description: `User  logged out`,
            metadata: { route: "/auth/logout", ip: req.ip }
        }).catch(log.error);

    },

    logoutAllDevices: async ({ user_id, currentSessionId, mode, req }) => {

        const whereCondition =
            mode === "others"
                ? { user_id, is_active: true, NOT: { id: currentSessionId } }
                : { user_id, is_active: true };

        const result = await authRepository.revokeAllSessions(whereCondition);

        await authRepository.logGlobalEvent({
            event: "logout_all",
            provider: "local",
            ip_address: req?.ip || null,
            user_agent: req?.headers["user-agent"] || null,
            details: {
                reason: mode === "others" ? "manual logout others" : "manual logout all",
                user_id,
                affected_sessions: result.count,
            },
        });
    },
};