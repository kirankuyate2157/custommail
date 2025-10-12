// src/repositories/user.repository.js
import { dbHelper } from "../config/dbHelper.js";

/**
 * @typedef {Object} CreateUserPayload
 * @property {string} email
 * @property {string} password
 * @property {string} fullName
 * @property {string} role
 * @property {string} tenantId
 */

/**
 * @typedef {Object} UpdateUserPayload
 * @property {string} [email]
 * @property {string} [password]
 * @property {string} [fullName]
 * @property {string} [role]
 * @property {string} [status]
 */

/**
 * User repository using dbHelper (ORM + raw support)
 */

// ------------------- CREATE USER -------------------
/**
 * @param {CreateUserPayload} data
 */
export const createUser = async (data) => {
  return dbHelper.model("user").create({ data });
};

// ------------------- FIND USER -------------------
/**
 * @param {string} email
 */
export const findUserByEmail = async (email) => {
  return dbHelper.model("user").findUnique({ where: { email } });
};

/**
 * @param {string} id
 */
export const findUserById = async (id) => {
  return dbHelper.model("user").findUnique({ where: { id } });
};

// ------------------- UPDATE USER -------------------
/**
 * @param {string} id
 * @param {UpdateUserPayload} data
 */
export const updateUser = async (id, data) => {
  return dbHelper.model("user").update({ where: { id }, data });
};

// ------------------- DELETE USER -------------------
/**
 * @param {string} id
 */
export const deleteUser = async (id) => {
  return dbHelper.model("user").delete({ where: { id } });
};

// ------------------- LIST USERS -------------------
/**
 * @param {string} [tenantId]
 * @param {number} [skip=0]
 * @param {number} [take=50]
 */
export const listUsers = async (tenantId, skip = 0, take = 50) => {
  const where = tenantId ? { tenantId } : {};
  return dbHelper.model("user").findMany({
    where,
    skip,
    take,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      status: true,
      tenantId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

// ------------------- RAW QUERY EXAMPLE -------------------
/**
 * @param {string} [tenantId]
 */
export const findUsersRaw = async (tenantId) => {
  const query = tenantId
    ? "SELECT id, email, fullName, role, status, tenantId, createdAt, updatedAt FROM user WHERE tenantId = ?"
    : "SELECT id, email, fullName, role, status, tenantId, createdAt, updatedAt FROM user";
  const params = tenantId ? [tenantId] : [];
  return dbHelper.rawQuery(query, params);
};

// ------------------- TRANSACTION EXAMPLE -------------------
/**
 * @param {string} id
 * @param {UpdateUserPayload} data
 */
export const updateAndLogUser = async (id, data) => {
  return dbHelper.transaction(async (tx) => {
    // Update user
    const updatedUser = await tx.user.update({ where: { id }, data });

    // Log action (raw query example)
    await tx.$queryRaw(
      "INSERT INTO user_logs(userId, action) VALUES (?, ?)",
      id,
      "User updated"
    );

    return updatedUser;
  });
};
