import { Router, type Response } from "express";
import db from "../config/database.js";
import { authMiddleware } from "../middleware/auth.js";
import type { AuthRequest, Sale, SaleWithDetails, Vehicle, Customer } from "../types/index.js";

const router = Router();

// All sales routes require authentication
router.use(authMiddleware);

/**
 * GET /api/sales
 * Lists all sales with vehicle and customer details.
 */
router.get("/", (req: AuthRequest, res: Response): void => {
  try {
    const sales = db.prepare(`
      SELECT
        s.*,
        v.make AS vehicle_make,
        v.model AS vehicle_model,
        v.year AS vehicle_year,
        c.first_name AS customer_first_name,
        c.last_name AS customer_last_name,
        c.email AS customer_email,
        u.name AS user_name
      FROM sales s
      JOIN vehicles v ON s.vehicle_id = v.id
      JOIN customers c ON s.customer_id = c.id
      JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
    `).all() as SaleWithDetails[];

    res.json(sales);
  } catch (error) {
    console.error("Error fetching sales:", error);
    res.status(500).json({ error: "Failed to fetch sales" });
  }
});

/**
 * GET /api/sales/stats
 * Returns aggregate sales statistics.
 */
router.get("/stats", (req: AuthRequest, res: Response): void => {
  try {
    const stats = db.prepare(`
      SELECT
        COUNT(*) AS totalSales,
        COALESCE(SUM(sale_price), 0) AS totalRevenue,
        COALESCE(AVG(sale_price), 0) AS averageSalePrice,
        COALESCE(MAX(sale_price), 0) AS highestSale,
        COALESCE(MIN(sale_price), 0) AS lowestSale
      FROM sales
    `).get() as {
      totalSales: number;
      totalRevenue: number;
      averageSalePrice: number;
      highestSale: number;
      lowestSale: number;
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching sales stats:", error);
    res.status(500).json({ error: "Failed to fetch sales statistics" });
  }
});

/**
 * GET /api/sales/:id
 * Returns a single sale with full details.
 */
router.get("/:id", (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const sale = db.prepare(`
      SELECT
        s.*,
        v.make AS vehicle_make,
        v.model AS vehicle_model,
        v.year AS vehicle_year,
        c.first_name AS customer_first_name,
        c.last_name AS customer_last_name,
        c.email AS customer_email,
        u.name AS user_name
      FROM sales s
      JOIN vehicles v ON s.vehicle_id = v.id
      JOIN customers c ON s.customer_id = c.id
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `).get(Number(id)) as SaleWithDetails | undefined;

    if (!sale) {
      res.status(404).json({ error: "Sale not found" });
      return;
    }

    res.json(sale);
  } catch (error) {
    console.error("Error fetching sale:", error);
    res.status(500).json({ error: "Failed to fetch sale" });
  }
});

/**
 * POST /api/sales
 * Creates a new sale. Marks the vehicle as 'sold'.
 */
router.post("/", (req: AuthRequest, res: Response): void => {
  try {
    const vehicle_id = req.body.vehicle_id ?? req.body.vehicleId;
    const customer_id = req.body.customer_id ?? req.body.customerId;
    const sale_price = req.body.sale_price != null
      ? Number(req.body.sale_price)
      : req.body.salePrice != null
      ? Number(req.body.salePrice)
      : null;
    const sale_date = req.body.sale_date ?? req.body.saleDate;
    const notes = req.body.notes ?? "";

    if (!vehicle_id || !customer_id || sale_price == null) {
      res.status(400).json({ error: "vehicle_id, customer_id, and sale_price are required" });
      return;
    }

    if (typeof sale_price !== "number" || sale_price <= 0) {
      res.status(400).json({ error: "sale_price must be a positive number" });
      return;
    }

    // Validate vehicle exists and is available
    const vehicle = db.prepare("SELECT * FROM vehicles WHERE id = ?").get(Number(vehicle_id)) as Vehicle | undefined;
    if (!vehicle) {
      res.status(404).json({ error: "Vehicle not found" });
      return;
    }
    if (vehicle.status === "sold") {
      res.status(409).json({ error: "This vehicle has already been sold" });
      return;
    }

    // Validate customer exists
    const customer = db.prepare("SELECT * FROM customers WHERE id = ?").get(Number(customer_id)) as Customer | undefined;
    if (!customer) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }

    const userId = req.user!.id;

    // Use a transaction to atomically create the sale and update the vehicle status
    const createSale = db.transaction(() => {
      const result = db.prepare(
        `INSERT INTO sales (vehicle_id, customer_id, user_id, sale_price, sale_date, notes)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(
        Number(vehicle_id),
        Number(customer_id),
        userId,
        sale_price,
        sale_date || new Date().toISOString().split("T")[0],
        notes?.trim() || ""
      );

      // Mark the vehicle as sold
      db.prepare("UPDATE vehicles SET status = 'sold', updated_at = datetime('now') WHERE id = ?")
        .run(Number(vehicle_id));

      return result.lastInsertRowid;
    });

    const saleId = createSale();

    // Fetch the complete sale record with details
    const sale = db.prepare(`
      SELECT
        s.*,
        v.make AS vehicle_make,
        v.model AS vehicle_model,
        v.year AS vehicle_year,
        c.first_name AS customer_first_name,
        c.last_name AS customer_last_name,
        c.email AS customer_email,
        u.name AS user_name
      FROM sales s
      JOIN vehicles v ON s.vehicle_id = v.id
      JOIN customers c ON s.customer_id = c.id
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `).get(saleId) as SaleWithDetails;

    res.status(201).json(sale);
  } catch (error) {
    console.error("Error creating sale:", error);
    res.status(500).json({ error: "Failed to create sale" });
  }
});

export default router;
