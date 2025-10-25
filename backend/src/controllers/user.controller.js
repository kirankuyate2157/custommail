import * as userService from "../services/user.service.js";
import { registerSchema, loginSchema, updateUserSchema } from "../validators/user.validator.js";
import log from "../config/logger.js";

/**
 * POST /users/create
 */
export const create = async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        status: "error",
        message: "Invalid input",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const data = parsed.data;

    // If tenant_id not provided, inherit from authenticated user (if available)
    if (!data.tenant_id && req.user?.tenant_id) {
      data.tenant_id = req.user.tenant_id;
    }

    const user = await userService.registerUser(data);

    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /users/me
 */
export const me = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthenticated" });
    const user = await userService.getUserById(req?.user?.user_id);
    if (!user) return res.status(404).json({ message: "User not found" });
    delete user.password_hash;
    res.json(user);
  } catch (err) { next(err); }
};

/**
 * GET /users
 */
export const list = async (req, res, next) => {
  try {
    let tenant_id = req.query.tenant_id || req.user?.tenant_id || null;
    const scopeParam = req.query.is_all;
    const isAll = scopeParam === "true" || scopeParam === true;
    if (isAll) {
      tenant_id = null;
    }
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const orderByField = req.query.orderBy || "created_at";
    const orderDirection = req.query.order?.toLowerCase() === "asc" ? "asc" : "desc";
    const search = req.query.search?.trim() || "";
    console.log("fff : ", tenant_id)
    const { users, total } = await userService.getUsers({
      tenant_id,
      search,
      skip,
      take: limit,
      orderByField,
      orderDirection,
    });

    res.status(200).json({
      status: "success",
      message: "Users fetched successfully",
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: users,
    });
  } catch (err) {
    next(err);
  }
};


/**
 * GET /users/:id
 */
export const getOne = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    delete user.password_hash;
    res.json(user);
  } catch (err) { next(err); }
};

/**
 * PUT /users/:id
 */
export const update = async (req, res, next) => {
  try {
    const body = updateUserSchema.safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({
        status: "error",
        errors: body.error.flatten().fieldErrors,
      });
    }
    const updated = await userService.updateUserProfile(req.params.id, body);
    res.json(updated);
  } catch (err) { next(err); }
};

/**
 * DELETE /users/:id
 */
export const remove = async (req, res, next) => {
  try {
    await userService.removeUser(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
};

/**
 * GET /users/:user_id/roles
 */
export const getUserRoles = async (req, res, next) => {
  try {
    const { user_id } = req.params;
    const tenant_id = req.query.tenant_id || req.auth?.tenant_id || null;
    const roles = await userService.getUserRoles({ user_id, tenant_id });
    res.status(200).json({ status: "success", data: roles });
  } catch (err) {
    log.error("getUserRoles failed:", err);
    next(err);
  }
};

/**
 * POST /users/:user_id/roles
 */
export const assignRoleToUser = async (req, res, next) => {
  try {
    const { user_id } = req.params;
    const { role_id, tenant_id, role_in_org } = req.body;
    const actor = req.auth?.user_id || null;

    const mapping = await userService.assignRoleToUser({
      user_id,
      role_id,
      tenant_id: tenant_id || req.auth?.tenant_id,
      role_in_org,
      actor,
    });

    res.status(201).json({ status: "success", data: mapping, message: "Role assigned" });
  } catch (err) {
    log.error("assignRoleToUser failed:", err);
    next(err);
  }
};

/**
 * DELETE /users/:user_id/roles/:role_id
 */
export const removeRoleFromUser = async (req, res, next) => {
  try {
    const { user_id, role_id } = req.params;
    const tenant_id = req.query.tenant_id || req.body.tenant_id || req.auth?.tenant_id;
    const actor = req.auth?.user_id || null;

    const result = await userService.removeRoleFromUser({ user_id, role_id, tenant_id, actor });

    if (!result) return res.status(404).json({ status: "error", message: "Role mapping not found" });

    res.status(200).json({ status: "success", message: "Role removed" });
  } catch (err) {
    log.error("removeRoleFromUser failed:", err);
    next(err);
  }
};

/**
 * GET /users/:user_id/permissions
 */
export const getUserPermissions = async (req, res, next) => {
  try {
    const { user_id } = req.params;
    const tenant_id = req.query.tenant_id || req.auth?.tenant_id;
    const permissions = await userService.getUserPermissions({ user_id, tenant_id });
    res.status(200).json({ status: "success", data: permissions });
  } catch (err) {
    log.error("getUserPermissions failed:", err);
    next(err);
  }
};
