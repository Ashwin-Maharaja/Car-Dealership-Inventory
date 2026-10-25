import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { initializeSchema } from "../models/schema.js";

const DATABASE_URL = process.env.DATABASE_URL || "./data/dealership.db";

// Ensure the directory for the database file exists
const dbDir = path.dirname(DATABASE_URL);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(DATABASE_URL);

// Enable WAL mode for better concurrent read performance
db.pragma("journal_mode = WAL");
// Enable foreign key enforcement
db.pragma("foreign_keys = ON");

// Initialize tables on first import
initializeSchema(db);

export default db;
