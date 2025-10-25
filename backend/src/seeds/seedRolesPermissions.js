import prisma from "../config/db.js";

const PERMISSIONS = {
  users: ["users:create", "users:view", "users:view:self", "users:update", "users:delete"],
  roles: ["roles:create", "roles:view", "roles:update", "roles:delete"],
  sessions: ["sessions:view", "sessions:revoke", "sessions:logs:view"],
  emails: ["email:send", "email:view", "email:template:create", "email:template:update", "email:template:delete"],
  tenant: ["tenant:view", "tenant:update"],
  audit: ["audit:view", "audit:export"],
  profile: ["profile:update", "password:change"]
};

async function seedDefaultRoles(tenant_id = null) {
  await prisma.$transaction(async (tx) => {
    // Step 1: Create all permissions
    const allPermissions = Array.from(new Set(Object.values(PERMISSIONS).flat()));
    const permissionMap = {};
    for (const key of allPermissions) {
      const perm = await tx.permissionMaster.upsert({
        where: { permission_key: key },
        update: {},
        create: { permission_key: key, description: key }
      });
      permissionMap[key] = perm.id;
    }

    // Step 2: Create roles
    const roles = [
      { name: "super_admin", tenant_id: null }, // global
      { name: "admin", tenant_id },
      { name: "lead", tenant_id },
      { name: "monitor", tenant_id },
      { name: "employee", tenant_id },
      { name: "visitor", tenant_id }
    ];

    for (const r of roles) {
      let role;

      if (r.tenant_id) {
        // Tenant-specific role: safe to use composite unique
        role = await prisma.role.upsert({
          where: { name_tenant_unique: { tenant_id: r.tenant_id, name: r.name } },
          update: {},
          create: { tenant_id: r.tenant_id, name: r.name, description: r.name },
        });
      } else {
        // Global role: tenant_id is null → cannot use composite unique
        role = await prisma.role.findFirst({ where: { name: r.name } });
        if (!role) {
          role = await prisma.role.create({
            data: { tenant_id: null, name: r.name, description: r.name },
          });
        }
      }
      // Step 3: Assign default permissions
      let keys = [];
      switch (r.name) {
        case "super_admin":
        case "admin":
          keys = allPermissions;
          break;
        case "lead":
          keys = [...PERMISSIONS.users, ...PERMISSIONS.sessions, ...PERMISSIONS.audit];
          break;
        case "monitor":
          keys = ["users:view", "sessions:view", "sessions:logs:view", "audit:view"];
          break;
        case "employee":
          keys = ["email:send", "email:view", "profile:update", "password:change"];
          break;
        case "visitor":
          keys = ["profile:update"];
          break;
      }

      await tx.rolePermission.createMany({
        data: Array.from(new Set(keys)).map(key => ({
          role_id: role.id,
          permission_id: permissionMap[key]
        })),
        skipDuplicates: true
      });
    }
  });

  console.log("Default roles and permissions seeded!");
}

seedDefaultRoles("6da8f0ab-7aa1-40a5-a6e2-65c7d9280c43")
  .catch(console.error)
  .finally(() => prisma.$disconnect());
