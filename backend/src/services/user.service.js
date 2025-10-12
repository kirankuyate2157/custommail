// src/services/user.service.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET, JWT_EXPIRES_IN, BCRYPT_SALT_ROUNDS } from "../config/env.js";
import * as userRepo from "../repositories/user.repository.js";

/**
 * @typedef {Object} CreateUserPayload
 * @property {string} email
 * @property {string} password
 * @property {string} fullName
 * @property {string} role
 * @property {string} tenantId
 */

/**
 * @typedef {Object} LoginPayload
 * @property {string} email
 * @property {string} password
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
 * Register a new user
 * @param {CreateUserPayload} payload
 */
export async function registerUser(payload) {
  const existing = await userRepo.findUserByEmail(payload.email);
  if (existing) throw new Error("User already exists");

  const hash = await bcrypt.hash(payload.password, BCRYPT_SALT_ROUNDS);
  const created = await userRepo.createUser({
    ...payload,
    password: hash,
  });

  delete created.password;
  return created;
}

/**
 * Authenticate a user
 * @param {LoginPayload} payload
 */
export async function authenticate(payload) {
  const user = await userRepo.findUserByEmail(payload.email);
  if (!user || !user.password) throw new Error("Invalid credentials");

  const ok = await bcrypt.compare(payload.password, user.password);
  if (!ok) throw new Error("Invalid credentials");

  const token = jwt.sign(
    { userId: user.id, tenantId: user.tenantId, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return { token, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, tenantId: user.tenantId } };
}

/**
 * @param {string} id
 */
export const getUserById = (id) => userRepo.findUserById(id);

/**
 * @param {string} id
 * @param {UpdateUserPayload} payload
 */
export const updateUserProfile = async (id, payload) => {
  if (payload.password) {
    payload.password = await bcrypt.hash(payload.password, BCRYPT_SALT_ROUNDS);
  }
  const updated = await userRepo.updateUser(id, payload);
  delete updated.password;
  return updated;
};

/**
 * @param {string} id
 */
export const removeUser = (id) => userRepo.deleteUser(id);

/**
 * @param {string} [tenantId]
 * @param {number} [skip]
 * @param {number} [take]
 */
export const getUsers = (tenantId, skip = 0, take = 50) =>
  userRepo.listUsers(tenantId, skip, take);
