import dotenv from "dotenv";
dotenv.config();

import app from "../src/index.js";
import db from "../src/config/database.js";
import jwt from "jsonwebtoken";
import type { Server } from "node:http";

export let testServer: Server;
export let baseUrl = "";

export async function startTestServer(): Promise<string> {
  return new Promise((resolve) => {
    testServer = app.listen(0, () => {
      const addr = testServer.address();
      if (typeof addr === "object" && addr) {
        baseUrl = `http://localhost:${addr.port}/api`;
        resolve(baseUrl);
      }
    });
  });
}

export async function stopTestServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (testServer) {
      testServer.close((err) => (err ? reject(err) : resolve()));
    } else {
      resolve();
    }
  });
}

export function generateTestToken(user: { id: number; email: string; role: "admin" | "user" | "staff" }): string {
  const secret = process.env.JWT_SECRET || "fallback-secret-do-not-use-in-prod";
  return jwt.sign(user, secret, { expiresIn: "1h" });
}

export function resetDatabase(): void {
  db.exec(`
    DELETE FROM sales;
    DELETE FROM customers;
    DELETE FROM vehicles;
    DELETE FROM users;
  `);
}
