// src/repositories/auth.repository.js
import { log } from "console";
import prisma from "../config/db.js";
import { v4 as uuidv4 } from "uuid";
import { id } from "zod/locales";

export const authRepository = {
    findUserByEmail: async (email) =>
        await prisma.users.findUnique({ where: { email } }),
    findUserById: async (id) =>
        await prisma.users.findUnique({ where: { user_id: id } }),
    findTenantByDomain: async (domain) =>
        await prisma.tenant.findUnique({ where: { domain } }),
    createTenant: async (tx, id, name, domain, plan_type) =>
        await tx.tenant.create({
            data: {
                id,
                name,
                domain: domain || null,
                plan_type: plan_type || null,
                status: "active",
            },
        }),
    updateTenant: async (tx, tenant_id, data) =>
        await tx.tenant.update({
            where: { id: tenant_id },
            data,
        }),
    createUser: async (tx, tenant_id, email, full_name, password_hash) =>
        await tx.users.create({
            data: {
                user_id: uuidv4(),
                tenant_id,
                email,
                full_name,
                password_hash,
                status: "active",
            },
        }),

    mapUserToTenant: (tx, tenant_id, user_id) =>
        tx.userOrgMap.create({
            data: {
                id: uuidv4(),
                role_in_org: "owner",
                user: {
                    connect: { user_id: user_id },
                },
                tenant: {
                    connect: { id: tenant_id },
                },
            },
        }),

    createDefaultPolicy: (tx, tenant_id) =>
        tx.tenantPolicy.create({
            data: { tenant_id, storage_limit_mb: 1024, allow_auto_sync: false },
        }),

    createDefaultRoles: async (tx, tenant_id) => {
        const role = await tx.role.create({
            data: {
                id: uuidv4(),
                tenant_id,
                name: "admin",
                description: "Tenant admin",
            },
        });
        await tx.rolePermission.createMany({
            data: [
                { id: uuidv4(), role_id: role.id, permission_key: "user:create" },
                { id: uuidv4(), role_id: role.id, permission_key: "user:update" },
            ],
        });
    },

    getUserTenant: (user_id) =>
        prisma.userOrgMap.findFirst({
            where: { user_id },
            select: { tenant_id: true },
        }),

    createSession: (user_id, tenant_id, req) =>
        prisma.session.create({
            data: {
                id: uuidv4(),
                user_id,
                tenant_id,
                ip_address: req.ip,
                deviceInfo: req.headers["user-agent"],
                token_version: 0,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
            },
        }),

    logSessionAttempt: async ({
        session_id = null,
        event = "generic_event",
        details = {},
        req = null,
    }) => {
        try {
            const logEntry = await prisma.sessionLog.create({
                data: {
                    id: uuidv4(),
                    session_id, // optional
                    event,
                    provider: "local", // default, can be customized if needed
                    ip_address: req?.ip || null,
                    user_agent: req?.headers?.["user-agent"] || null,
                    details,
                },
            });
            return logEntry;
        } catch (err) {
            console.error("Error logging session attempt:", err);
            // Don't break main flow
            return null;
        }
    },

    revokeSession: async (session_id, user_id) => {
        return prisma.session.updateMany({
            where: { id: session_id, user_id, is_active: true },
            data: { is_active: false, revoked_at: new Date() },
        });
    },

    revokeAllSessions: async (whereCondition) => {
        return prisma.session.updateMany({
            where: whereCondition,
            data: { is_active: false, revoked_at: new Date() },
        });
    },

    logGlobalEvent: async ({ event, provider, ip_address, user_agent, details }) => {
        return prisma.sessionLog.create({
            data: {
                id: uuidv4(),
                event,
                provider,
                ip_address,
                user_agent,
                details,
                created_at: new Date(),
            },
        });
    },

    logEvent: async ({
        session_id,
        user_id,
        event,
        provider,
        ip_address,
        user_agent,
        details,
    }) => {
        const log = await prisma.sessionLog.create({
            data: {
                id: uuidv4(),
                session: { connect: { id: session_id } },
                event,
                provider,
                ip_address,
                user_agent,
                details,
                created_at: new Date(),
            },
        });
    },


};
