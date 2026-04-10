// ============================================================
// backend/src/middleware/auth.js  — PRODUCTION UPGRADED
// FIX 1: Handles TokenExpiredError separately (clear message)
// FIX 2: Attaches full user object (not just decoded payload)
// FIX 3: Role-based access control helper added
// ============================================================

const jwt = require("jsonwebtoken");

module.exports = {
  requireAuth: (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in.",
      });
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // { id, role, email }
      next();
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Session expired. Please log in again.",
        });
      }
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please log in again.",
      });
    }
  },

  // Role-based access control
  // Usage: router.delete("/:id", requireAuth, restrictTo("admin"), handler)
  restrictTo: (...allowedRoles) => {
    return (req, res, next) => {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to perform this action.",
        });
      }
      next();
    };
  },
};
