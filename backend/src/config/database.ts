import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import { initializeSchema } from "../models/schema.js";

const DATABASE_URL = process.env.DATABASE_URL || "./data/dealership.db";

// Ensure the directory for the database file exists
const dbDir = path.dirname(DATABASE_URL);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export interface RunResult {
  changes: number | bigint;
  lastInsertRowid: number;
}

export interface Statement<T = unknown> {
  get(...params: unknown[]): T | undefined;
  all(...params: unknown[]): T[];
  run(...params: unknown[]): RunResult;
}

export class SQLiteDatabase {
  private raw: DatabaseSync;

  constructor(filePath: string) {
    this.raw = new DatabaseSync(filePath);
  }

  exec(sql: string): void {
    this.raw.exec(sql);
  }

  pragma(pragmaStr: string): void {
    this.raw.exec(`PRAGMA ${pragmaStr};`);
  }

  prepare<T = unknown>(sql: string): Statement<T> {
    const stmt = this.raw.prepare(sql);
    return {
      get: (...params: unknown[]): T | undefined => {
        return stmt.get(...params) as T | undefined;
      },
      all: (...params: unknown[]): T[] => {
        return stmt.all(...params) as T[];
      },
      run: (...params: unknown[]): RunResult => {
        const res = stmt.run(...params);
        return {
          changes: res.changes,
          lastInsertRowid: Number(res.lastInsertRowid),
        };
      },
    };
  }

  transaction<T>(fn: (...args: unknown[]) => T): (...args: unknown[]) => T {
    return (...args: unknown[]): T => {
      this.raw.exec("BEGIN");
      try {
        const result = fn(...args);
        this.raw.exec("COMMIT");
        return result;
      } catch (error) {
        this.raw.exec("ROLLBACK");
        throw error;
      }
    };
  }
}

const db = new SQLiteDatabase(DATABASE_URL);

// Enable WAL mode for better concurrent performance
db.pragma("journal_mode = WAL");
// Set busy timeout to 5 seconds to prevent database locked errors under concurrent access
db.pragma("busy_timeout = 5000");
// Enable foreign key enforcement
db.pragma("foreign_keys = ON");

// Initialize tables on startup
initializeSchema(db);

export default db;
