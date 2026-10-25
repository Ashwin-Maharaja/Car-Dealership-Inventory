import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../config/database.js";
import type { User, TokenPayload } from "../types/index.js";

const router = Router();
const getJwtSecret = () => process.env.JWT_SECRET || "fallback-secret-do-not-use-in-prod";
const TOKEN_EXPIRY = "24h";

/**
 * POST /api/auth/register
 * Creates a new user account and returns a JWT token.
 */
router.post("/register", (req: Request, res: Response): void => {
  try {
    const { email, password, name, role } = req.body;

    // Input validation
    if (!email || !password || !name) {
      res.status(400).json({ error: "Email, password, and name are required" });
      return;
    }

    if (typeof email !== "string" || !email.includes("@")) {
      res.status(400).json({ error: "A valid email address is required" });
      return;
    }

    if (typeof password !== "string" || password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    const validRoles = ["admin", "user", "staff"];
    const userRole = validRoles.includes(role) ? role : "user";

    // Check if user already exists
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email) as User | undefined;
    if (existing) {
      res.status(409).json({ error: "A user with this email already exists" });
      return;
    }

    // Hash password and insert user
    const passwordHash = bcrypt.hashSync(password, 12);
    const result = db.prepare(
      "INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)"
    ).run(email.trim().toLowerCase(), passwordHash, name.trim(), userRole);

    const payload: TokenPayload = {
      id: result.lastInsertRowid as number,
      email: email.trim().toLowerCase(),
      role: userRole,
    };

    const token = jwt.sign(payload, getJwtSecret(), { expiresIn: TOKEN_EXPIRY });

    res.status(201).json({
      token,
      user: {
        id: payload.id,
        email: payload.email,
        name: name.trim(),
        role: userRole,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error during registration" });
  }
});

/**
 * POST /api/auth/login
 * Authenticates a user and returns a JWT token.
 */
router.post("/login", (req: Request, res: Response): void => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    // Look up user by email
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(
      email.trim().toLowerCase()
    ) as User | undefined;

    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    // Verify password
    const passwordValid = bcrypt.compareSync(password, user.password_hash);
    if (!passwordValid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const payload: TokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, getJwtSecret(), { expiresIn: TOKEN_EXPIRY });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error during login" });
  }
});

export default router;
