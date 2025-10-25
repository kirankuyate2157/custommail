// src/utils/permission.helper.js
import prisma from "../config/db.js";
import { getCache, setCache, clearCache } from "./cache.js";

export const resolveUserPermissions = async (userId, tenantId) => {
  const cacheKey = `perms:${tenantId}:${userId}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const maps = await prisma.userOrgMap.findMany({
    where: { user_id: userId, tenant_id: tenantId },
    include: { role: { include: { permissions: true } } }
  });

  const perms = new Set();
  maps.forEach(m => {
    m.role?.permissions?.forEach(rp => perms.add(rp.permission_key));
  });

  const result = Array.from(perms);
  await setCache(cacheKey, result, 600);
  return result;
};

export const invalidateUserPermissionsCache = async (userId, tenantId) => {
  await clearCache(`perms:${tenantId}:${userId}`);
};
