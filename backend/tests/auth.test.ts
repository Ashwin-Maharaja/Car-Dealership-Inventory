import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { startTestServer, stopTestServer, baseUrl, resetDatabase } from "./helpers.js";

describe("Auth API Endpoints", () => {
  before(async () => {
    await startTestServer();
  });

  after(async () => {
    await stopTestServer();
  });

  beforeEach(() => {
    resetDatabase();
  });

  describe("POST /api/auth/register", () => {
    it("should successfully register a new user and return a JWT token", async () => {
      const response = await fetch(`${baseUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test User",
          email: "test@example.com",
          password: "password123",
          role: "user",
        }),
      });

      assert.equal(response.status, 201);
      const data = await response.json();
      assert.ok(data.token, "Response should include a JWT token");
      assert.equal(data.user.email, "test@example.com");
      assert.equal(data.user.name, "Test User");
      assert.equal(data.user.role, "user");
    });

    it("should reject registration with missing required fields", async () => {
      const response = await fetch(`${baseUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "incomplete@example.com",
        }),
      });

      assert.equal(response.status, 400);
      const data = await response.json();
      assert.ok(data.error);
    });

    it("should reject registration when email is already taken", async () => {
      // First registration
      await fetch(`${baseUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Original User",
          email: "duplicate@example.com",
          password: "password123",
        }),
      });

      // Second registration with same email
      const response = await fetch(`${baseUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Another User",
          email: "duplicate@example.com",
          password: "password456",
        }),
      });

      assert.equal(response.status, 409);
      const data = await response.json();
      assert.match(data.error, /already exists/i);
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      // Register a user for login tests
      await fetch(`${baseUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Login Test User",
          email: "login@example.com",
          password: "correctpassword",
          role: "user",
        }),
      });
    });

    it("should log in successfully with valid credentials", async () => {
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "login@example.com",
          password: "correctpassword",
        }),
      });

      assert.equal(response.status, 200);
      const data = await response.json();
      assert.ok(data.token);
      assert.equal(data.user.email, "login@example.com");
    });

    it("should reject login with wrong password", async () => {
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "login@example.com",
          password: "wrongpassword",
        }),
      });

      assert.equal(response.status, 401);
      const data = await response.json();
      assert.match(data.error, /invalid email or password/i);
    });

    it("should reject login for non-existent email", async () => {
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "unknown@example.com",
          password: "anypassword",
        }),
      });

      assert.equal(response.status, 401);
      const data = await response.json();
      assert.match(data.error, /invalid email or password/i);
    });
  });
});
