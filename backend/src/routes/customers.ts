import { Router, type Request, type Response } from "express";
import db from "../config/database.js";
import { authMiddleware } from "../middleware/auth.js";
import type { Customer, AuthRequest } from "../types/index.js";

const router = Router();

/**
 * GET /api/customers
 * Lists all customers with optional search. Requires authentication.
 */
router.get("/", authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const { search } = req.query;

    let query = "SELECT * FROM customers";
    const params: string[] = [];

    if (search && typeof search === "string") {
      query += " WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?";
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern, pattern);
    }

    query += " ORDER BY created_at DESC";

    const customers = db.prepare(query).all(...params) as Customer[];
    res.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

/**
 * GET /api/customers/:id
 * Returns a single customer by ID. Requires authentication.
 */
router.get("/:id", authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const customer = db.prepare("SELECT * FROM customers WHERE id = ?").get(Number(id)) as Customer | undefined;

    if (!customer) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }

    res.json(customer);
  } catch (error) {
    console.error("Error fetching customer:", error);
    res.status(500).json({ error: "Failed to fetch customer" });
  }
});

/**
 * POST /api/customers
 * Creates a new customer record. Requires authentication.
 */
router.post("/", authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const first_name = req.body.first_name ?? req.body.firstName;
    const last_name = req.body.last_name ?? req.body.lastName;
    const email = req.body.email;
    const phone = req.body.phone;
    const address = req.body.address;

    if (!first_name || !last_name || !email) {
      res.status(400).json({ error: "first_name, last_name, and email are required" });
      return;
    }

    if (typeof email !== "string" || !email.includes("@")) {
      res.status(400).json({ error: "A valid email address is required" });
      return;
    }

    // Check for duplicate email
    const existing = db.prepare("SELECT id FROM customers WHERE email = ?").get(email.trim().toLowerCase());
    if (existing) {
      res.status(409).json({ error: "A customer with this email already exists" });
      return;
    }

    const result = db.prepare(
      "INSERT INTO customers (first_name, last_name, email, phone, address) VALUES (?, ?, ?, ?, ?)"
    ).run(
      first_name.trim(),
      last_name.trim(),
      email.trim().toLowerCase(),
      phone?.trim() || "",
      address?.trim() || ""
    );

    const customer = db.prepare("SELECT * FROM customers WHERE id = ?").get(result.lastInsertRowid) as Customer;
    res.status(201).json(customer);
  } catch (error) {
    console.error("Error creating customer:", error);
    res.status(500).json({ error: "Failed to create customer" });
  }
});

/**
 * PUT /api/customers/:id
 * Updates an existing customer. Requires authentication.
 */
router.put("/:id", authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const existing = db.prepare("SELECT * FROM customers WHERE id = ?").get(Number(id)) as Customer | undefined;

    if (!existing) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }

    const first_name = req.body.first_name ?? req.body.firstName ?? existing.first_name;
    const last_name = req.body.last_name ?? req.body.lastName ?? existing.last_name;
    const email = req.body.email ?? existing.email;
    const phone = req.body.phone ?? existing.phone;
    const address = req.body.address ?? existing.address;

    // If email changed, check for conflicts
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : email;
    if (normalizedEmail !== existing.email) {
      const emailConflict = db.prepare("SELECT id FROM customers WHERE email = ? AND id != ?").get(normalizedEmail, Number(id));
      if (emailConflict) {
        res.status(409).json({ error: "A customer with this email already exists" });
        return;
      }
    }

    db.prepare(
      "UPDATE customers SET first_name = ?, last_name = ?, email = ?, phone = ?, address = ? WHERE id = ?"
    ).run(first_name, last_name, normalizedEmail, phone, address, Number(id));

    const updated = db.prepare("SELECT * FROM customers WHERE id = ?").get(Number(id)) as Customer;
    res.json(updated);
  } catch (error) {
    console.error("Error updating customer:", error);
    res.status(500).json({ error: "Failed to update customer" });
  }
});

/**
 * DELETE /api/customers/:id
 * Deletes a customer. Requires authentication. Fails if the customer has sales.
 */
router.delete("/:id", authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const existing = db.prepare("SELECT * FROM customers WHERE id = ?").get(Number(id)) as Customer | undefined;

    if (!existing) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }

    const hasSales = db.prepare("SELECT id FROM sales WHERE customer_id = ?").get(Number(id));
    if (hasSales) {
      res.status(409).json({ error: "Cannot delete a customer with associated sales records" });
      return;
    }

    db.prepare("DELETE FROM customers WHERE id = ?").run(Number(id));
    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({ error: "Failed to delete customer" });
  }
});

export default router;
