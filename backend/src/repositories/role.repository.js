import prisma from "../config/db.js";


export const createRole = async ({ tenantId, name, description }) => {
  return prisma.role.create({ data: { tenant_id: tenantId, name, description }});
};

export const getRolesByTenant = async (tenantId) => {
  return prisma.role.findMany({ where: { tenant_id: tenantId }, include: { permissions: true }});
};

export const findRoleById = async (id) => prisma.role.findUnique({ where: { id }, include: { permissions: true }});
