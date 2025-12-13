// src/backend/middleware/auth.js
const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  // Skip JWT if this is a device request
  if (req.headers["x-device-token"]) {
    return next();
  }

  const header = req.headers.authorization;

  if (!header) {
    return res
      .status(401)
      .json({ message: "JWT DEBUG: Missing authorization header" });
  }

  const parts = header.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res
      .status(401)
      .json({ message: "Invalid authorization format" });
  }

  const token = parts[1];

  jwt.verify(
    token,
    process.env.JWT_SECRET || "secret123",
    (err, decoded) => {
      if (err) {
        return res
          .status(401)
          .json({ message: "Invalid or expired token" });
      }

      req.user = { id: decoded.id };
      next();
    }
  );
};
