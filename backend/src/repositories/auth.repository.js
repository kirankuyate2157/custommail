// src/repositories/auth.repository.js
import { log } from "console";
import prisma from "../config/db.js";
import { v4 as uuidv4 } from "uuid";
import { id } from "zod/locales";

export const authRepository = {
    updateLastLogin: async (user_id) => await prisma.users.update({ where: { user_id }, data: { last_login_at: new Date() }, }),
    findUserByEmail: async (email) => await prisma.users.findUnique({ where: { email } }),
    findUserById: async (id) => await prisma.users.findUnique({ where: { user_id: id } }),
    findTenantByDomain: async (domain) => await prisma.tenant.findUnique({ where: { domain } }),
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
    updateTenant: async (tx, tenant_id, data) => await tx.tenant.update({ where: { id: tenant_id }, data, }),
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


    mapUserToTenant: async (tx, tenant_id, user_id, role_id) => {
        return tx.userOrgMap.create({
            data: {
                id: uuidv4(),
                user: { connect: { user_id } },
                tenant: { connect: { id: tenant_id } },
                role: { connect: { id: role_id } }, // ✅ required now
                role_in_org: "owner",
            },
        });
    },

    createDefaultPolicy: (tx, tenant_id) =>
        tx.tenantPolicy.create({
            data: { tenant_id, storage_limit_mb: 1024, allow_auto_sync: false },
        }),

    createDefaultRolesAndPermissions: async (tx, tenant_id, user_id) => {
        // Define default roles
        const defaultRoles = [
            { name: "admin", description: "Tenant admin with full access" },
            { name: "employee", description: "Regular employee role" },
        ];

        for (const roleData of defaultRoles) {
            const role = await tx.role.create({
                data: {
                    id: uuidv4(),
                    tenant_id,
                    name: roleData.name,
                    description: roleData.description,
                },
            });

            // Fetch permission IDs from PermissionMaster
            let permissionKeys = [];
            if (roleData.name === "admin") {
                permissionKeys = [
                    "user:create",
                    "user:update",
                    "user:delete",
                    "role:create",
                    "role:update",
                    "role:delete",
                    "policy:manage"
                ];
            } else if (roleData.name === "employee") {
                permissionKeys = ["user:view", "task:update"];
            }

            const permissions = await tx.permissionMaster.findMany({
                where: { permission_key: { in: permissionKeys } },
            });

            const rolePerms = permissions.map(p => ({
                id: uuidv4(),
                role_id: role.id,
                permission_id: p.id,
            }));

            await tx.rolePermission.createMany({ data: rolePerms });

            // Map admin user to the role automatically
            if (roleData.name === "admin" && user_id) {
                await tx.userOrgMap.create({
                    data: {
                        id: uuidv4(),
                        user_id,
                        role_id: role.id,
                        tenant_id,
                    },
                });
            }
        }
    },

    createDefaultPermissionsIfNotExist: async (tx) => {
        const defaultPermissions = [
            { permission_key: "user:create", description: "Create users" },
            { permission_key: "user:update", description: "Update users" },
            { permission_key: "user:delete", description: "Delete users" },
            { permission_key: "user:view", description: "View users" },
            { permission_key: "role:create", description: "Create roles" },
            { permission_key: "role:update", description: "Update roles" },
            { permission_key: "role:delete", description: "Delete roles" },
            { permission_key: "policy:manage", description: "Manage tenant policies" },
            { permission_key: "task:update", description: "Update tasks" },
        ];

        for (const perm of defaultPermissions) {
            await tx.permissionMaster.upsert({
                where: { permission_key: perm.permission_key },
                update: {}, // nothing to update, just keep it if exists
                create: {
                    id: uuidv4(),
                    permission_key: perm.permission_key,
                    description: perm.description || null,
                },
            });
        }
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
