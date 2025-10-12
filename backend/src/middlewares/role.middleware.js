// src/middlewares/role.middleware.js

export const permit = (...allowed) => {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role) return res.status(403).json({ message: "Forbidden" });
    if (allowed.includes(role)) return next();
    return res.status(403).json({ message: "Forbidden" });
  };
};
