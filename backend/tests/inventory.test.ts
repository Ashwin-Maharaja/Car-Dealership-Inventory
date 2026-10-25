import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { startTestServer, stopTestServer, baseUrl, resetDatabase, generateTestToken } from "./helpers.js";

describe("Inventory Management Endpoints", () => {
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
    userToken = generateTestToken({ id: 1, email: "buyer@test.com", role: "user" });
    adminToken = generateTestToken({ id: 2, email: "admin@test.com", role: "admin" });
  });

  describe("POST /api/vehicles/:id/purchase", () => {
    it("should successfully purchase a vehicle, decreasing its stock quantity by 1", async () => {
      // Create vehicle with quantity 2
      const createRes = await fetch(`${baseUrl}/vehicles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          make: "Toyota",
          model: "Prius",
          category: "Electric",
          price: 29000,
          quantity: 2,
          vin: "VIN_PRIUS_1",
        }),
      });
      const vehicle = await createRes.json();

      // Purchase 1 unit
      const purchaseRes = await fetch(`${baseUrl}/vehicles/${vehicle.id}/purchase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ quantity: 1 }),
      });

      assert.equal(purchaseRes.status, 200);
      const purchaseData = await purchaseRes.json();
      assert.equal(purchaseData.vehicle.quantity, 1);
      assert.equal(purchaseData.vehicle.status, "available");
    });

    it("should transition status to 'sold' when the last unit is purchased", async () => {
      // Create vehicle with quantity 1
      const createRes = await fetch(`${baseUrl}/vehicles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          make: "Mazda",
          model: "CX-5",
          category: "SUV",
          price: 31000,
          quantity: 1,
          vin: "VIN_MAZDA_1",
        }),
      });
      const vehicle = await createRes.json();

      // Purchase the only available unit
      const purchaseRes = await fetch(`${baseUrl}/vehicles/${vehicle.id}/purchase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ quantity: 1 }),
      });

      assert.equal(purchaseRes.status, 200);
      const purchaseData = await purchaseRes.json();
      assert.equal(purchaseData.vehicle.quantity, 0);
      assert.equal(purchaseData.vehicle.status, "sold");
    });

    it("should reject purchase when vehicle is out of stock (quantity = 0)", async () => {
      // Create vehicle with quantity 0
      const createRes = await fetch(`${baseUrl}/vehicles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          make: "BMW",
          model: "M3",
          category: "Coupe",
          price: 75000,
          quantity: 0,
          vin: "VIN_M3_OUTOFSTOCK",
        }),
      });
      const vehicle = await createRes.json();

      // Attempt to purchase
      const purchaseRes = await fetch(`${baseUrl}/vehicles/${vehicle.id}/purchase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ quantity: 1 }),
      });

      assert.equal(purchaseRes.status, 400);
      const err = await purchaseRes.json();
      assert.match(err.error, /out of stock/i);
    });
  });

  describe("POST /api/vehicles/:id/restock (Admin only)", () => {
    it("should reject restock when attempted by non-admin user (403 Forbidden)", async () => {
      const createRes = await fetch(`${baseUrl}/vehicles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          make: "Hyundai",
          model: "Elantra",
          category: "Sedan",
          price: 21000,
          quantity: 1,
          vin: "VIN_ELANTRA",
        }),
      });
      const vehicle = await createRes.json();

      const restockRes = await fetch(`${baseUrl}/vehicles/${vehicle.id}/restock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ quantity: 5 }),
      });

      assert.equal(restockRes.status, 403);
    });

    it("should successfully restock a vehicle when executed by Admin", async () => {
      const createRes = await fetch(`${baseUrl}/vehicles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          make: "Kia",
          model: "Telluride",
          category: "SUV",
          price: 42000,
          quantity: 0,
          vin: "VIN_TELLURIDE",
        }),
      });
      const vehicle = await createRes.json();
      assert.equal(vehicle.quantity, 0);

      // Admin restocks 4 units
      const restockRes = await fetch(`${baseUrl}/vehicles/${vehicle.id}/restock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ quantity: 4 }),
      });

      assert.equal(restockRes.status, 200);
      const restockData = await restockRes.json();
      assert.equal(restockData.vehicle.quantity, 4);
      assert.equal(restockData.vehicle.status, "available");
    });
  });
});
