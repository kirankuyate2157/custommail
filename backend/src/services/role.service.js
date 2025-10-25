import * as roleRepo from "../repositories/role.repository.js";
import * as rpRepo from "../repositories/rolePermission.repository.js";
import { invalidateUserPermissionsCache } from "../utils/permission.helper.js";

export const createRole = async ({ tenantId, name, description, permissions = [] }) => {
  const role = await roleRepo.createRole({ tenantId, name, description });
  if (permissions.length) await rpRepo.addPermissionsToRole(role.id, permissions);
  return role;
};

export const addPermissions = async (roleId, keys = []) => {
  await rpRepo.addPermissionsToRole(roleId, keys);
  // Invalidate caches for users of that role (optional - you need to find them)
};
