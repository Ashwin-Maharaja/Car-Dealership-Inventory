import { Router, type Response } from "express";
import db from "../config/database.js";
import { authMiddleware } from "../middleware/auth.js";
import type { AuthRequest, DashboardStats, SaleWithDetails, MonthlySales } from "../types/index.js";

const router = Router();

// Dashboard routes require authentication
router.use(authMiddleware);

/**
 * GET /api/dashboard/stats
 * Returns comprehensive dashboard statistics including totals,
 * recent sales, and monthly sales breakdown.
 */
router.get("/stats", (req: AuthRequest, res: Response): void => {
  try {
    // Total and available vehicle counts
    const vehicleCounts = db.prepare(`
      SELECT
        COUNT(*) AS totalVehicles,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS availableVehicles
      FROM vehicles
    `).get() as { totalVehicles: number; availableVehicles: number };

    // Total sales count and revenue
    const salesSummary = db.prepare(`
      SELECT
        COUNT(*) AS totalSales,
        COALESCE(SUM(sale_price), 0) AS totalRevenue
      FROM sales
    `).get() as { totalSales: number; totalRevenue: number };

    // Last 5 recent sales with vehicle, customer, and user details
    const recentSales = db.prepare(`
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
      LIMIT 5
    `).all() as SaleWithDetails[];

    // Monthly sales for the last 6 months
    const monthlySales = db.prepare(`
      SELECT
        strftime('%Y-%m', sale_date) AS month,
        COUNT(*) AS count,
        COALESCE(SUM(sale_price), 0) AS revenue
      FROM sales
      WHERE sale_date >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', sale_date)
      ORDER BY month ASC
    `).all() as MonthlySales[];

    const stats: DashboardStats = {
      totalVehicles: vehicleCounts.totalVehicles,
      availableVehicles: vehicleCounts.availableVehicles,
      totalSales: salesSummary.totalSales,
      totalRevenue: salesSummary.totalRevenue,
      recentSales,
      monthlySales,
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: "Failed to fetch dashboard statistics" });
  }
});

export default router;
