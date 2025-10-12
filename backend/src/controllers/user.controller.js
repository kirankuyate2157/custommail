// src/controllers/user.controller.js
import * as userService from "../services/user.service.js";

export const register = async (req, res, next) => {
  try {
    const body = req.body;
    const user = await userService.registerUser(body);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await userService.authenticate({ email, password });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const me = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthenticated" });
    const u = await userService.getUserById(req.user.id);
    if (!u) return res.status(404).json({ message: "User not found" });
    if (u.password) delete u.password;
    res.json(u);
  } catch (err) {
    next(err);
  }
};

export const list = async (req, res, next) => {
  try {
    const tenantId = req.query.tenantId;
    const skip = Number(req.query.skip ?? 0);
    const take = Number(req.query.take ?? 50);
    const users = await userService.getUsers(tenantId, skip, take);
    res.json(users);
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.password) delete user.password;
    res.json(user);
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const updated = await userService.updateUserProfile(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    await userService.removeUser(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
