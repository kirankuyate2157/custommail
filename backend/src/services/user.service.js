import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import * as userRepo from "../repositories/user.repository.js";
import * as tenantRepo from "../repositories/tenant.repository.js";
import { BCRYPT_SALT_ROUNDS, JWT_SECRET, JWT_EXPIRES_IN } from "../config/env.js";
import { invalidateUserPermissionsCache, resolveUserPermissions } from "../utils/permission.helper.js";
import prisma from "../config/db.js";


/**
 * Register a new user
 * Handles tenant creation if tenantId not provided
 */
export async function registerUser(payload) {
  const existingUser = await userRepo.findUserByEmail(payload.email);
  if (existingUser) throw { status: 400, message: "User already exists" };

  let tenant_id = payload.tenant_id;

  // Case 1: No tenant_id -> create new tenant
  if (!tenant_id) {
    const newTenant = await tenantRepo.createTenant({
      id: uuidv4(),
      name: `${payload.full_name}'s Tenant`,
    });
    tenant_id = newTenant.id;
    payload.role = "owner"; // first user of tenant is owner
  } else {
    // Case 2: tenant_id provided -> must exist
    const tenantExists = await tenantRepo.findTenantById(tenant_id);
    if (!tenantExists) throw { status: 400, message: "Invalid tenant ID" };
    payload.role = payload.role ?? "member";
  }

  // Hash password
  const hash = await bcrypt.hash(payload.password, BCRYPT_SALT_ROUNDS);

  // Create user
  const user = await userRepo.createUser({ ...payload, password: hash, tenant_id });
  delete user.password_hash;
  return user;
}


/**
 * Get single user
 */
export const getUserById = (id) => userRepo.findUserById(id);

/**
 * List users for tenant with pagination
 */
export const getUsers = async (params) => {
  const { tenant_id, search, skip, take, orderByField, orderDirection } = params;
  console.log("tannn :: ",tenant_id)
  return userRepo.listUsers(tenant_id, search, skip, take, orderByField, orderDirection);
};

/**
 * Update user profile (including password hash if provided)
 */
export const updateUserProfile = async (id, payload) => {
  if (payload.password_hash) {
    payload.password_hash = await bcrypt.hash(payload.password_hash, BCRYPT_SALT_ROUNDS);
  }
  const updated = await userRepo.updateUser(id, payload);
  delete updated.password_hash;
  return updated;
};

/**
 * Delete user
 */
export const removeUser = (id) => userRepo.deleteUser(id);

/**
 * Get roles for user (optionally by tenant)
 */
export const getUserRoles = async ({ user_id, tenant_id = null }) => {
  const maps = await userRepo.getUserOrgMaps({ user_id, tenant_id });
  return maps.map((m) => ({
    id: m.id,
    user_id: m.user_id,
    tenant_id: m.tenant_id,
    role_id: m.role_id,
    role_in_org: m.role_in_org,
    role: m.role ? { id: m.role.id, name: m.role.name, description: m.role.description } : null,
    created_at: m.created_at,
  }));
};

/**
 * Assign or upsert role to user
 */
export const assignRoleToUser = async ({ user_id, role_id, tenant_id, role_in_org = null, actor = null }) => {
  const user = await userRepo.findUserById(user_id);
  if (!user) throw { status: 404, message: "User not found" };

  const role = await userRepo.findRoleById(role_id);
  if (!role) throw { status: 404, message: "Role not found" };

  if (!tenant_id) tenant_id = role.tenant_id;

  if (role.tenant_id !== tenant_id) throw { status: 400, message: "Role does not belong to provided tenant" };

  const mapping = await userRepo.upsertUserOrgMap({ user_id, tenant_id, role_id, role_in_org });

  try { await invalidateUserPermissionsCache(user_id, tenant_id); } catch (e) { console.warn(e); }

  try {
    await prisma.adminAuditLog?.create({
      data: {
        actor_id: actor || null,
        action: "assign_role",
        target: user_id,
        details: { role_id, tenant_id },
      },
    });
  } catch (e) {}

  return mapping;
};

/**
 * Remove role mapping
 */
export const removeRoleFromUser = async ({ user_id, role_id, tenant_id, actor = null }) => {
  const mapping = await userRepo.getUserOrgMap({ user_id, tenant_id });
  if (!mapping || mapping.role_id !== role_id) return null;

  await userRepo.deleteUserOrgMap({ id: mapping.id });

  try { await invalidateUserPermissionsCache(user_id, tenant_id); } catch (e) { console.warn(e); }

  try {
    await prisma.adminAuditLog?.create({
      data: {
        actor_id: actor || null,
        action: "remove_role",
        target: user_id,
        details: { role_id, tenant_id },
      },
    });
  } catch (e) {}

  return true;
};

/**
 * Get effective permissions for user
 */
export const getUserPermissions = async ({ user_id, tenant_id }) => {
  if (!tenant_id) throw { status: 400, message: "tenant_id is required" };
  return resolveUserPermissions(user_id, tenant_id);
};
