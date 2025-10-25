import * as roleService from "../services/role.service.js";

export const createRole = async (req, res) => {
  try {
    const tenantId = req.auth.tenant_id;
    const { name, description, permissions } = req.body;
    const role = await roleService.createRole({ tenantId, name, description, permissions });
    return res.status(201).json({ status: "success", data: role });
  } catch (err) {
    return res.status(err.status || 500).json({ status: "error", message: err.message || "Internal server error" });
  }
};

export const listRoles = async (req, res) => {
  try {
    const roles = await roleService.getRolesByTenant(req.auth.tenant_id);
    return res.json({ status: "success", data: roles });
  } catch (err) {
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
};
