import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { startTestServer, stopTestServer, baseUrl, resetDatabase, generateTestToken } from "./helpers.js";

describe("Vehicles API Endpoints", () => {
  let userToken = "";
  let adminToken = "";

  before(async () => {
    await startTestServer();
  });

  after(async () => {
    await stopTestServer();
  });

  beforeEach(() => {
    resetDatabase();
    userToken = generateTestToken({ id: 1, email: "user@test.com", role: "user" });
    adminToken = generateTestToken({ id: 2, email: "admin@test.com", role: "admin" });
  });

  describe("Protected access check", () => {
    it("should return 401 when requesting vehicles without token", async () => {
      const response = await fetch(`${baseUrl}/vehicles`);
      assert.equal(response.status, 401);
    });
  });

  describe("POST /api/vehicles (Add vehicle)", () => {
    it("should successfully add a new vehicle with make, model, category, price, and quantity", async () => {
      const response = await fetch(`${baseUrl}/vehicles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          make: "Honda",
          model: "Civic",
          category: "Sedan",
          year: 2024,
          price: 26000,
          quantity: 3,
          color: "Silver",
          vin: "1HGCR2F83HA123456",
        }),
      });

      assert.equal(response.status, 201);
      const vehicle = await response.json();
      assert.ok(vehicle.id);
      assert.equal(vehicle.make, "Honda");
      assert.equal(vehicle.model, "Civic");
      assert.equal(vehicle.category, "Sedan");
      assert.equal(vehicle.price, 26000);
      assert.equal(vehicle.quantity, 3);
      assert.equal(vehicle.status, "available");
    });

    it("should reject adding vehicle with missing required fields", async () => {
      const response = await fetch(`${baseUrl}/vehicles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          make: "Honda",
        }),
      });

      assert.equal(response.status, 400);
    });
  });

  describe("GET /api/vehicles/search (Search & Filter)", () => {
    beforeEach(async () => {
      // Seed test vehicles
      const vehicles = [
        { make: "Toyota", model: "RAV4", category: "SUV", price: 32000, quantity: 2, vin: "VIN_RAV4" },
        { make: "Ford", model: "F-150", category: "Truck", price: 45000, quantity: 1, vin: "VIN_F150" },
        { make: "Tesla", model: "Model 3", category: "Electric", price: 38000, quantity: 4, vin: "VIN_M3" },
      ];

      for (const v of vehicles) {
        await fetch(`${baseUrl}/vehicles`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify(v),
        });
      }
    });

    it("should search vehicles by category", async () => {
      const response = await fetch(`${baseUrl}/vehicles/search?category=SUV`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      assert.equal(response.status, 200);
      const data = await response.json();
      assert.equal(data.total, 1);
      assert.equal(data.vehicles[0].category, "SUV");
      assert.equal(data.vehicles[0].model, "RAV4");
    });

    it("should filter vehicles by price range", async () => {
      const response = await fetch(`${baseUrl}/vehicles/search?minPrice=35000&maxPrice=40000`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      assert.equal(response.status, 200);
      const data = await response.json();
      assert.equal(data.total, 1);
      assert.equal(data.vehicles[0].make, "Tesla");
    });

    it("should search vehicles by make or model keyword", async () => {
      const response = await fetch(`${baseUrl}/vehicles/search?search=Ford`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      assert.equal(response.status, 200);
      const data = await response.json();
      assert.equal(data.total, 1);
      assert.equal(data.vehicles[0].model, "F-150");
    });
  });

  describe("PUT /api/vehicles/:id (Update vehicle)", () => {
    it("should update a vehicle's details", async () => {
      const createdRes = await fetch(`${baseUrl}/vehicles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          make: "Toyota",
          model: "Corolla",
          category: "Sedan",
          price: 22000,
          quantity: 2,
          vin: "VIN_COROLLA_UPDATE",
        }),
      });
      const created = await createdRes.json();

      const updateRes = await fetch(`${baseUrl}/vehicles/${created.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          price: 23500,
          color: "Deep Blue",
        }),
      });

      assert.equal(updateRes.status, 200);
      const updated = await updateRes.json();
      assert.equal(updated.price, 23500);
      assert.equal(updated.color, "Deep Blue");
    });
  });

  describe("DELETE /api/vehicles/:id (Delete vehicle - Admin only)", () => {
    it("should reject deletion when called by non-admin user (403 Forbidden)", async () => {
      const createdRes = await fetch(`${baseUrl}/vehicles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          make: "Subaru",
          model: "Crosstrek",
          category: "Crossover",
          price: 28000,
          quantity: 1,
          vin: "VIN_SUBARU_DEL",
        }),
      });
      const created = await createdRes.json();

      const deleteRes = await fetch(`${baseUrl}/vehicles/${created.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${userToken}` },
      });

      assert.equal(deleteRes.status, 403);
    });

    it("should allow vehicle deletion when called by an Admin", async () => {
      const createdRes = await fetch(`${baseUrl}/vehicles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          make: "Subaru",
          model: "Crosstrek",
          category: "Crossover",
          price: 28000,
          quantity: 1,
          vin: "VIN_SUBARU_DEL2",
        }),
      });
      const created = await createdRes.json();

      const deleteRes = await fetch(`${baseUrl}/vehicles/${created.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      assert.equal(deleteRes.status, 204);

      // Verify it no longer exists
      const getRes = await fetch(`${baseUrl}/vehicles/${created.id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(getRes.status, 404);
    });
  });
});
