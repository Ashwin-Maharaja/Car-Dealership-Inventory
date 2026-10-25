import type { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { AuthRequest, TokenPayload } from "../types/index.js";

const getJwtSecret = () => process.env.JWT_SECRET || "fallback-secret-do-not-use-in-prod";

/**
 * Express middleware that verifies a JWT Bearer token from the Authorization header.
 * On success, attaches the decoded user payload to `req.user`.
 * On failure, responds with 401 Unauthorized.
 */
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authorization header with Bearer token is required" });
    return;
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Token is missing" });
    return;
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as TokenPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Express middleware ensuring the authenticated user has 'admin' privileges.
 * Responds with 403 Forbidden if the user is not an admin.
 */
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ error: "Forbidden: Admin access required" });
    return;
  }
  next();
}
