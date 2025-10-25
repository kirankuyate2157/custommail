// src/repositories/user.repository.js

import prisma from "../config/db.js";

/**
 * Create a new user
 */
export const createUser = async (data) => {
  const prismaData = {
    full_name: data.full_name,
    email: data.email,
    password_hash: data.password, // hashed before this call
    role: data.role,
    tenant: data.tenant_id ? { connect: { id: data.tenant_id } } : undefined,
    status: data.status || "active",
    created_at: new Date(),
    updated_at: new Date(),
  };

  return prisma.users.create({ data: prismaData });
};

/**
 * Find user by email
 */
export const findUserByEmail = async (email) => {
  return prisma.users.findUnique({ where: { email } });
};

/**
 * Find user by ID
 */
export const findUserById = async (user_id) => {
  return prisma.users.findUnique({ where: { user_id } });
};

/**
 * Update user details
 */
export const updateUser = async (id, data) => {
  const updateData = {
    ...data,
    updated_at: new Date(),
  };
  return prisma.users.update({ where: { id }, data: updateData });
};

/**
 * Delete user by ID
 */
export const deleteUser = async (id) => {
  return prisma.users.delete({ where: { id } });
};

/**
 * Count total users
 */
export const countUsers = async () => {
  return prisma.users.count();
};

/**
 * List users with pagination and optional tenant filtering
 */
const isUuid = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
export const listUsers = async (
  tenant_id = null,
  search = "",
  skip = 0,
  take = 20,
  orderByField = "created_at",
  orderDirection = "desc"
) => {
  console.log(" tant id :; ",tenant_id)
  const where = {
    ...(tenant_id ? { tenant_id } : {}),
    ...(search
      ? {
          OR: [
            { username: { contains: search, mode: "insensitive" } },
            { full_name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
             ...(isUuid(search) ? [{ user_id: { equals: search } }] : []),
          ],
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    prisma.users.findMany({
      where,
      skip,
      take,
      orderBy: { [orderByField]: orderDirection },
      select: {
        user_id: true,
        username: true,
        full_name: true,
        email: true,
        role: true,
        status: true,
        tenant_id: true,
        created_at: true,
        updated_at: true,
      },
    }),
    prisma.users.count({ where }),
  ]);

  return { users, total };
};

/**
 * Upsert user-organization role mapping
 */
export const upsertUserOrgMap = async ({ user_id, tenant_id, role_id, role_in_org = null }) => {
  return prisma.usersOrgMap.upsert({
    where: { user_id_tenant_id: { user_id, tenant_id } },
    create: { user_id, tenant_id, role_id, role_in_org },
    update: { role_id, role_in_org },
    include: { role: { include: { permissions: true } } },
  });
};

/**
 * Get all user-organization mappings (optionally filter by tenant)
 */
export const getUserOrgMaps = async ({ user_id, tenant_id = null }) => {
  const where = tenant_id ? { user_id, tenant_id } : { user_id };
  return prisma.usersOrgMap.findMany({
    where,
    include: { role: { include: { permissions: true } } },
    orderBy: { created_at: "desc" },
  });
};

/**
 * Get a specific user-organization mapping
 */
export const getUserOrgMap = async ({ user_id, tenant_id }) => {
  return prisma.usersOrgMap.findUnique({
    where: { user_id_tenant_id: { user_id, tenant_id } },
    include: { role: { include: { permissions: true } } },
  });
};

/**
 * Delete user-organization mapping
 */
export const deleteUserOrgMap = async (id) => {
  return prisma.usersOrgMap.delete({ where: { id } });
};

/**
 * Find role by ID (including permissions)
 */
export const findRoleById = async (role_id) => {
  return prisma.role.findUnique({
    where: { id: role_id },
    include: { permissions: true },
  });
};
