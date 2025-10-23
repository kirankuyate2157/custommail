import prisma from "../config/db.js";
import { log } from "../config/logger.js";

export const SessionRepository = {
    /**
     * Create a new session record
     */
    async create(data) {
        try {
            const session = await prisma.session.create({ data });
            log.debug("Session created:", session.id);
            return session;
        } catch (err) {
            log.error("Error creating session:", err);
            throw err;
        }
    },

    /**
     * Find session by ID
     */
    async findById(id) {
        try {
            return await prisma.session.findUnique({ where: { id } });
        } catch (err) {
            log.error("Error finding session by ID:", err);
            throw err;
        }
    },

    findSessions: async ({ user_id, session_id, tenant_id, search, is_active, skip, limit }) => {
        const filters = {};

        if (user_id) filters.user_id = user_id;
        if (session_id) filters.id = session_id;
        if (tenant_id) filters.tenant_id = tenant_id;
        if (is_active === true) filters.is_active = true;
        if (is_active === false) filters.is_active = false;

        // Build dynamic where clause
        const whereClause = {
            AND: [
                filters,
                search
                    ? {
                        OR: [
                            { user: { full_name: { contains: search, mode: "insensitive" } } },
                            { user: { email: { contains: search, mode: "insensitive" } } },
                        ],
                    }
                    : {},
            ],
        };

        // Fetch sessions
        const [sessions, totalCount] = await Promise.all([
            prisma.session.findMany({
                where: whereClause,
                include: {
                    user: { select: { user_id: true, full_name: true, email: true } },
                    tenant: { select: { id: true, name: true } },
                },
                orderBy: { created_at: "desc" },
                skip,
                take: limit,
            }),
            prisma.session.count({ where: whereClause }),
        ]);

        // Format sessions
        const formatted = sessions.map((s) => ({
            session_id: s.id,
            user_id: s.user_id,
            username: s.user?.username,
            email: s.user?.email,
            tenant_id: s.tenant_id,
            tenant_name: s.tenant?.name,
            ip_address: s.ip_address,
            device_name: s.device_name,
            location: s.location,
            is_active: s.is_active,
            created_at: s.created_at,
            last_active_at: s.last_active_at,
        }));

        return { sessions: formatted, totalCount };
    },
    /**
     * Find all active sessions by user ID
     */
    async findByUser(user_id) {
        try {
            return await prisma.session.findMany({
                where: { user_id, is_active: true },
                orderBy: { created_at: "desc" },
            });
        } catch (err) {
            log.error("Error finding sessions by user:", err);
            throw err;
        }
    },

    /**
     * Deactivate a specific session
     */
    async deactivate(session_id) {
        try {
            return await prisma.session.update({
                where: { id: session_id },
                data: { is_active: false, revoked_at: new Date() },
            });
        } catch (err) {
            log.error("Error deactivating session:", err);
            throw err;
        }
    },

    /**
     * Find session by refresh token hash
     */
    async findByRefreshHash(refreshHash) {
        return prisma.session.findFirst({ where: { refresh_token: refreshHash } });
    },

    /**
     * Find session by ID and user
     */
    async findByIdAndUser(id, user_id) {
        return prisma.session.findFirst({ where: { id, user_id } });
    },

    /**
     * Update session
     */
    async update(where, data) {
        return prisma.session.update({ where, data });
    },

    /**
     * Update many sessions
     */
    async updateMany(where, data) {
        return prisma.session.updateMany({ where, data });
    },

    /**
     * Deactivate one session by ID
     */
    async deactivateById(id) {
        return prisma.session.update({
            where: { id },
            data: { is_active: false, revoked_at: new Date() },
        });
    },

    /**
     * Deactivate all active sessions for a user
     */
    async deactivateAllByUser(user_id) {
        return prisma.session.updateMany({
            where: { user_id, is_active: true },
            data: { is_active: false, revoked_at: new Date() },
        });
    },

    /**
     * Count all active sessions for a user
     */
    async countActiveByUser(user_id) {
        return prisma.session.count({ where: { user_id, is_active: true } });
    },

    async listSessionsForUser(user_id) {
        return SessionRepository.findAllByUser(user_id);
    }
    ,
    /**
     * Deactivate older sessions beyond the allowed limit
     */
    async deactivateOldSessions(user_id, limit) {
        const sessions = await prisma.session.findMany({
            where: { user_id, is_active: true },
            orderBy: { created_at: "asc" },
        });

        if (sessions.length > limit) {
            const oldSessions = sessions.slice(0, sessions.length - limit);
            const ids = oldSessions.map((s) => s.id);

            await prisma.session.updateMany({
                where: { id: { in: ids } },
                data: { is_active: false, revoked_at: new Date() },
            });

            log.info(
                `Deactivated ${oldSessions.length} old sessions for user: ${user_id}`
            );
        }
    },

    /**
     * Log session-related events (login, logout, token refresh, etc.)
     */
    async logEvent(data, req = null) {
        try {
            const { session_id, event, details, provider = "local" } = data;

            return await prisma.sessionLog.create({
                data: {
                    session_id,
                    event,
                    provider,
                    ip_address: req?.ip || null,
                    user_agent: req?.headers["user-agent"] || null,
                    details,
                },
            });
        } catch (err) {
            log.error("Error creating session log:", err);
            throw err;
        }
    },
    findSessionLogs: async ({ user_id, session_id, tenant_id, search, action, skip, limit }) => {
        const filters = {};

        if (session_id) filters.session_id = session_id;
        if (tenant_id) filters.tenant_id = tenant_id;
        if (action) filters.event = action;

        // We cannot filter directly by user fields, so we will filter by session.user_id if user_id is provided
        if (user_id) {
            filters.session = { user_id };
        }

        const whereClause = {
            AND: [filters],
        };

        const [logs, totalCount] = await Promise.all([
            prisma.sessionLog.findMany({
                where: whereClause,
                include: {
                    session: {
                        select: {
                            id: true,
                            ip_address: true,
                            device_name: true,
                            user: { select: { user_id: true, full_name: true, email: true } }, // nested user
                        },
                    },
                },
                orderBy: { created_at: "desc" },
                skip,
                take: limit,
            }),
            prisma.sessionLog.count({ where: whereClause }),
        ]);

        const formatted = logs.map((l) => ({
            session_log_id: l.id,
            session_id: l.session_id,
            user_id: l.session?.user?.user_id || null,
            username: l.session?.user?.full_name || null,
            email: l.session?.user?.email || null,
            tenant_id: l.tenant_id,
            event: l.event,
            details: l.details,
            ip_address: l.ip_address || l.session?.ip_address || null,
            device_name: l.session?.device_name || null,
            user_agent: l.user_agent || null,
            created_at: l.created_at,
        }));

        return { logs: formatted, totalCount };
    },

};
