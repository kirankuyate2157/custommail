import { prisma } from "../prisma/index.js";

export const addPermissionsToRole = async (roleId, keys = []) => {
  const data = keys.map(k => ({ role_id: roleId, permission_key: k }));
  return prisma.rolePermission.createMany({ data, skipDuplicates: true });
};

export const removePermissionFromRole = async (roleId, key) => {
  return prisma.rolePermission.deleteMany({ where: { role_id: roleId, permission_key: key }});
};
