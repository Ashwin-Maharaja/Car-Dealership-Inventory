import { Router, type Response } from "express";
import db from "../config/database.js";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";
import type { Vehicle, AuthRequest, VehicleQueryParams, PaginatedVehiclesResponse } from "../types/index.js";

const router = Router();

// All vehicle and inventory routes are protected
router.use(authMiddleware);

/**
 * GET /api/vehicles/search
 * Searches for vehicles by make, model, category, or price range.
 * Placed before `/:id` to avoid route conflict.
 */
router.get("/search", (req: AuthRequest, res: Response): void => {
  try {
    const {
      search,
      make,
      model,
      category,
      minPrice,
      maxPrice,
      sortBy = "created_at",
      sortOrder = "desc",
      page = "1",
      limit = "12",
    } = req.query as VehicleQueryParams;

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    // General search across make, model, and category
    if (search) {
      conditions.push("(make LIKE ? OR model LIKE ? OR category LIKE ? OR color LIKE ?)");
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern, pattern);
    }

    if (make) {
      conditions.push("make LIKE ?");
      params.push(`%${make}%`);
    }

    if (model) {
      conditions.push("model LIKE ?");
      params.push(`%${model}%`);
    }

    if (category) {
      conditions.push("LOWER(category) = LOWER(?)");
      params.push(category.trim());
    }

    if (minPrice != null && minPrice !== "") {
      conditions.push("price >= ?");
      params.push(Number(minPrice));
    }

    if (maxPrice != null && maxPrice !== "") {
      conditions.push("price <= ?");
      params.push(Number(maxPrice));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count total matching
    const countQuery = `SELECT COUNT(*) AS count FROM vehicles ${whereClause}`;
    const totalRow = db.prepare(countQuery).get(...params) as { count: number };
    const total = totalRow.count;

    // Sorting
    const allowedSortFields = ["price", "year", "mileage", "created_at", "quantity", "make", "model"];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "created_at";
    const safeSortOrder = sortOrder.toLowerCase() === "asc" ? "ASC" : "DESC";

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 12));
    const offset = (pageNum - 1) * limitNum;

    const listQuery = `
      SELECT * FROM vehicles
      ${whereClause}
      ORDER BY ${safeSortBy} ${safeSortOrder}
      LIMIT ? OFFSET ?
    `;

    const vehicles = db.prepare(listQuery).all(...params, limitNum, offset) as Vehicle[];
    const totalPages = Math.ceil(total / limitNum) || 1;

    const response: PaginatedVehiclesResponse = {
      vehicles,
      total,
      page: pageNum,
      totalPages,
    };

    res.json(response);
  } catch (error) {
    console.error("Error searching vehicles:", error);
    res.status(500).json({ error: "Failed to search vehicles" });
  }
});

/**
 * GET /api/vehicles
 * Lists available vehicles with optional filtering, sorting, and pagination.
 */
router.get("/", (req: AuthRequest, res: Response): void => {
  try {
    const {
      search,
      make,
      model,
      category,
      minPrice,
      maxPrice,
      minYear,
      maxYear,
      status,
      sortBy = "created_at",
      sortOrder = "desc",
      page = "1",
      limit = "12",
    } = req.query as VehicleQueryParams;

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    // Search query
    if (search) {
      conditions.push("(make LIKE ? OR model LIKE ? OR category LIKE ? OR color LIKE ?)");
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern, pattern);
    }

    if (make) {
      conditions.push("make LIKE ?");
      params.push(`%${make}%`);
    }

    if (model) {
      conditions.push("model LIKE ?");
      params.push(`%${model}%`);
    }

    if (category) {
      conditions.push("LOWER(category) = LOWER(?)");
      params.push(category.trim());
    }

    if (minPrice != null && minPrice !== "") {
      conditions.push("price >= ?");
      params.push(Number(minPrice));
    }

    if (maxPrice != null && maxPrice !== "") {
      conditions.push("price <= ?");
      params.push(Number(maxPrice));
    }

    if (minYear != null && minYear !== "") {
      conditions.push("year >= ?");
      params.push(Number(minYear));
    }

    if (maxYear != null && maxYear !== "") {
      conditions.push("year <= ?");
      params.push(Number(maxYear));
    }

    if (status && ["available", "sold", "pending"].includes(status)) {
      conditions.push("status = ?");
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count matching rows
    const countQuery = `SELECT COUNT(*) AS count FROM vehicles ${whereClause}`;
    const totalRow = db.prepare(countQuery).get(...params) as { count: number };
    const total = totalRow.count;

    // Sorting
    const allowedSortFields = ["price", "year", "mileage", "created_at", "quantity", "make", "model"];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "created_at";
    const safeSortOrder = sortOrder.toLowerCase() === "asc" ? "ASC" : "DESC";

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 12));
    const offset = (pageNum - 1) * limitNum;

    const listQuery = `
      SELECT * FROM vehicles
      ${whereClause}
      ORDER BY ${safeSortBy} ${safeSortOrder}
      LIMIT ? OFFSET ?
    `;

    const vehicles = db.prepare(listQuery).all(...params, limitNum, offset) as Vehicle[];
    const totalPages = Math.ceil(total / limitNum) || 1;

    res.json({
      vehicles,
      total,
      page: pageNum,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    res.status(500).json({ error: "Failed to fetch vehicles" });
  }
});

/**
 * GET /api/vehicles/:id
 * Returns a single vehicle by ID.
 */
router.get("/:id", (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const vehicle = db.prepare("SELECT * FROM vehicles WHERE id = ?").get(Number(id)) as Vehicle | undefined;

    if (!vehicle) {
      res.status(404).json({ error: "Vehicle not found" });
      return;
    }

    res.json(vehicle);
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    res.status(500).json({ error: "Failed to fetch vehicle" });
  }
});

/**
 * POST /api/vehicles
 * Adds a new vehicle.
 * Required: make, model, category, price
 */
router.post("/", (req: AuthRequest, res: Response): void => {
  try {
    const {
      make,
      model,
      category = "Sedan",
      color = "Black",
      status = "available",
      description = "",
    } = req.body;

    const year = Number(req.body.year) || new Date().getFullYear();
    const price = Number(req.body.price);
    const quantity = req.body.quantity != null ? Number(req.body.quantity) : 1;
    const mileage = Number(req.body.mileage ?? 0);
    const image_url = req.body.image_url ?? req.body.imageUrl ?? "";

    // Generate VIN if not provided
    const vin = (req.body.vin || `VIN${Date.now()}${Math.random().toString(36).substring(2, 7)}`).toUpperCase();

    if (!make || !model || price == null || isNaN(price)) {
      res.status(400).json({ error: "make, model, and price are required" });
      return;
    }

    if (price < 0) {
      res.status(400).json({ error: "Price must be a non-negative number" });
      return;
    }

    if (quantity < 0) {
      res.status(400).json({ error: "Quantity cannot be negative" });
      return;
    }

    const existingVin = db.prepare("SELECT id FROM vehicles WHERE vin = ?").get(vin) as Vehicle | undefined;
    if (existingVin) {
      res.status(409).json({ error: "A vehicle with this VIN already exists" });
      return;
    }

    const initialStatus = quantity === 0 ? "sold" : status;

    const result = db.prepare(
      `INSERT INTO vehicles
         (make, model, category, year, price, quantity, mileage, color, vin, status, description, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      make.trim(),
      model.trim(),
      category.trim(),
      year,
      price,
      quantity,
      mileage,
      color.trim(),
      vin,
      initialStatus,
      description.trim(),
      image_url.trim()
    );

    const vehicle = db.prepare("SELECT * FROM vehicles WHERE id = ?").get(result.lastInsertRowid) as Vehicle;
    res.status(201).json(vehicle);
  } catch (error) {
    console.error("Error creating vehicle:", error);
    res.status(500).json({ error: "Failed to create vehicle" });
  }
});

/**
 * PUT /api/vehicles/:id
 * Updates an existing vehicle's details.
 */
router.put("/:id", (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const existing = db.prepare("SELECT * FROM vehicles WHERE id = ?").get(Number(id)) as Vehicle | undefined;

    if (!existing) {
      res.status(404).json({ error: "Vehicle not found" });
      return;
    }

    const make = req.body.make ?? existing.make;
    const model = req.body.model ?? existing.model;
    const category = req.body.category ?? existing.category;
    const year = req.body.year != null ? Number(req.body.year) : existing.year;
    const price = req.body.price != null ? Number(req.body.price) : existing.price;
    const quantity = req.body.quantity != null ? Number(req.body.quantity) : existing.quantity;
    const mileage = req.body.mileage != null ? Number(req.body.mileage) : existing.mileage;
    const color = req.body.color ?? existing.color;
    const vin = req.body.vin ?? existing.vin;
    const status = req.body.status ?? (quantity === 0 ? "sold" : existing.status);
    const description = req.body.description ?? existing.description;
    const image_url = req.body.image_url ?? req.body.imageUrl ?? existing.image_url;

    if (price < 0) {
      res.status(400).json({ error: "Price must be non-negative" });
      return;
    }

    if (quantity < 0) {
      res.status(400).json({ error: "Quantity cannot be negative" });
      return;
    }

    if (vin !== existing.vin) {
      const vinConflict = db.prepare("SELECT id FROM vehicles WHERE vin = ? AND id != ?").get(vin, Number(id));
      if (vinConflict) {
        res.status(409).json({ error: "A vehicle with this VIN already exists" });
        return;
      }
    }

    db.prepare(
      `UPDATE vehicles
       SET make = ?, model = ?, category = ?, year = ?, price = ?, quantity = ?,
           mileage = ?, color = ?, vin = ?, status = ?, description = ?,
           image_url = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(
      make.trim(),
      model.trim(),
      category.trim(),
      year,
      price,
      quantity,
      mileage,
      color.trim(),
      vin.trim().toUpperCase(),
      status,
      description.trim(),
      image_url.trim(),
      Number(id)
    );

    const updated = db.prepare("SELECT * FROM vehicles WHERE id = ?").get(Number(id)) as Vehicle;
    res.json(updated);
  } catch (error) {
    console.error("Error updating vehicle:", error);
    res.status(500).json({ error: "Failed to update vehicle" });
  }
});

/**
 * DELETE /api/vehicles/:id
 * Deletes a vehicle. Restricted to Admin only.
 */
router.delete("/:id", requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const existing = db.prepare("SELECT * FROM vehicles WHERE id = ?").get(Number(id)) as Vehicle | undefined;

    if (!existing) {
      res.status(404).json({ error: "Vehicle not found" });
      return;
    }

    // Check if vehicle has associated sales
    const hasSales = db.prepare("SELECT COUNT(*) AS count FROM sales WHERE vehicle_id = ?").get(Number(id)) as { count: number };
    if (hasSales.count > 0) {
      res.status(409).json({ error: "Cannot delete vehicle with recorded sales history" });
      return;
    }

    db.prepare("DELETE FROM vehicles WHERE id = ?").run(Number(id));
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    res.status(500).json({ error: "Failed to delete vehicle" });
  }
});

/**
 * POST /api/vehicles/:id/purchase
 * Purchases a vehicle, decreasing its quantity in stock.
 */
router.post("/:id/purchase", (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const purchaseQty = Math.max(1, parseInt(req.body.quantity, 10) || 1);

    const vehicle = db.prepare("SELECT * FROM vehicles WHERE id = ?").get(Number(id)) as Vehicle | undefined;

    if (!vehicle) {
      res.status(404).json({ error: "Vehicle not found" });
      return;
    }

    if (vehicle.quantity <= 0) {
      res.status(400).json({ error: "Vehicle is out of stock" });
      return;
    }

    if (vehicle.quantity < purchaseQty) {
      res.status(400).json({
        error: `Insufficient stock. Only ${vehicle.quantity} available.`,
      });
      return;
    }

    const newQty = vehicle.quantity - purchaseQty;
    const newStatus = newQty === 0 ? "sold" : vehicle.status;

    const performPurchase = db.transaction(() => {
      // 1. Update vehicle quantity & status
      db.prepare(
        `UPDATE vehicles
         SET quantity = ?, status = ?, updated_at = datetime('now')
         WHERE id = ?`
      ).run(newQty, newStatus, Number(id));

      // 2. Log sale transaction
      let userId = req.user?.id || 1;
      const existingUser = db.prepare("SELECT id FROM users WHERE id = ?").get(userId) as { id: number } | undefined;
      if (!existingUser) {
        db.prepare(
          "INSERT OR IGNORE INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)"
        ).run(userId, req.user?.email || `user_${userId}@dealership.com`, "dummy_hash", "Buyer", "user");
      }

      // Get or create dummy/default customer if needed
      let customer = db.prepare("SELECT id FROM customers LIMIT 1").get() as { id: number } | undefined;
      let customerId = customer?.id;
      if (!customerId) {
        const newCust = db.prepare(
          "INSERT INTO customers (first_name, last_name, email) VALUES (?, ?, ?)"
        ).run("Direct", "Buyer", `buyer_${Date.now()}@dealership.com`);
        customerId = newCust.lastInsertRowid as number;
      }

      db.prepare(
        `INSERT INTO sales (vehicle_id, customer_id, user_id, sale_price, sale_date, notes)
         VALUES (?, ?, ?, ?, date('now'), ?)`
      ).run(
        Number(id),
        customerId,
        userId,
        vehicle.price * purchaseQty,
        `Purchased ${purchaseQty} unit(s)`
      );
    });

    performPurchase();

    const updated = db.prepare("SELECT * FROM vehicles WHERE id = ?").get(Number(id)) as Vehicle;
    res.json({
      message: "Purchase successful",
      vehicle: updated,
      purchasedQuantity: purchaseQty,
    });
  } catch (error) {
    console.error("Error purchasing vehicle:", error);
    res.status(500).json({ error: "Failed to process purchase" });
  }
});

/**
 * POST /api/vehicles/:id/restock
 * Restocks a vehicle, increasing its quantity. Restricted to Admin only.
 */
router.post("/:id/restock", requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const restockQty = parseInt(req.body.quantity, 10);

    if (isNaN(restockQty) || restockQty <= 0) {
      res.status(400).json({ error: "Restock quantity must be a positive integer" });
      return;
    }

    const vehicle = db.prepare("SELECT * FROM vehicles WHERE id = ?").get(Number(id)) as Vehicle | undefined;

    if (!vehicle) {
      res.status(404).json({ error: "Vehicle not found" });
      return;
    }

    const newQty = vehicle.quantity + restockQty;

    db.prepare(
      `UPDATE vehicles
       SET quantity = ?, status = 'available', updated_at = datetime('now')
       WHERE id = ?`
    ).run(newQty, Number(id));

    const updated = db.prepare("SELECT * FROM vehicles WHERE id = ?").get(Number(id)) as Vehicle;
    res.json({
      message: "Restock successful",
      vehicle: updated,
      addedQuantity: restockQty,
    });
  } catch (error) {
    console.error("Error restocking vehicle:", error);
    res.status(500).json({ error: "Failed to process restock" });
  }
});

export default router;
