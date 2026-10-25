import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import vehicleRoutes from "./routes/vehicles.js";
import customerRoutes from "./routes/customers.js";
import salesRoutes from "./routes/sales.js";
import dashboardRoutes from "./routes/dashboard.js";

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);

// Middleware
app.use(cors());
app.use(express.json());

// Root endpoints
app.get("/", (req, res) => {
  if (req.accepts("html") && !req.accepts("json")) {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AutoDealer Pro - API Server</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b1329; color: #f8fafc; margin: 0; padding: 40px 20px; }
          .container { max-width: 720px; margin: 0 auto; background: #131c38; border: 1px solid #1e293b; border-radius: 12px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          h1 { margin-top: 0; color: #38bdf8; font-size: 1.8rem; }
          .badge { display: inline-block; background: #10b981; color: white; padding: 4px 10px; border-radius: 9999px; font-size: 0.85rem; font-weight: 600; }
          .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 10px; transition: background 0.2s; }
          .btn:hover { background: #1d4ed8; }
          ul { list-style: none; padding: 0; margin-top: 15px; }
          li { background: #1e294b; margin: 8px 0; padding: 12px 16px; border-radius: 6px; font-family: monospace; display: flex; justify-content: space-between; align-items: center; }
          a.link { color: #38bdf8; text-decoration: none; font-family: sans-serif; font-size: 0.9rem; }
          a.link:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h1>🚗 AutoDealer Pro API</h1>
            <span class="badge">● Online (Port 3001)</span>
          </div>
          <p style="color: #94a3b8;">Backend REST API server with persistent SQLite database.</p>
          
          <div style="background:#1e293b; padding:20px; border-radius:8px; margin:24px 0; border-left: 4px solid #38bdf8;">
            <h3 style="margin-top:0; color:#fff;">Looking for the Graphical Web App?</h3>
            <p style="margin:0 0 12px 0; color:#cbd5e1;">The interactive frontend dashboard runs on port 5173.</p>
            <a class="btn" href="http://localhost:5173">Open Frontend Web App (http://localhost:5173) &rarr;</a>
          </div>

          <h3 style="color:#e2e8f0; margin-top: 24px;">Direct API Links</h3>
          <ul>
            <li><span>GET /api/health</span> <a class="link" href="/api/health" target="_blank">Test Health Check &rarr;</a></li>
            <li><span>GET /api/vehicles</span> <a class="link" href="/api/vehicles" target="_blank">View Vehicles List &rarr;</a></li>
            <li><span>GET /api/dashboard/stats</span> <a class="link" href="/api/dashboard/stats" target="_blank">View Dashboard Stats &rarr;</a></li>
            <li><span>GET /api/customers</span> <a class="link" href="/api/customers" target="_blank">View Customers &rarr;</a></li>
            <li><span>GET /api/sales</span> <a class="link" href="/api/sales" target="_blank">View Sales History &rarr;</a></li>
          </ul>
        </div>
      </body>
      </html>
    `);
    return;
  }

  res.json({
    message: "🚗 AutoDealer Pro API is online",
    version: "1.0.0",
    frontendUrl: "http://localhost:5173",
    documentation: "See README.md for complete API specification",
    endpoints: {
      health: "GET /api/health",
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
      },
      vehicles: {
        list: "GET /api/vehicles",
        search: "GET /api/vehicles/search",
        get: "GET /api/vehicles/:id",
        create: "POST /api/vehicles",
        update: "PUT /api/vehicles/:id",
        delete: "DELETE /api/vehicles/:id (Admin only)",
        purchase: "POST /api/vehicles/:id/purchase",
        restock: "POST /api/vehicles/:id/restock (Admin only)",
      },
      customers: "GET /api/customers",
      sales: "GET /api/sales",
      dashboard: "GET /api/dashboard/stats",
    },
  });
});

app.get("/api", (_req, res) => {
  res.redirect("/");
});

// Friendly aliases for common unprefixed endpoints
app.get("/vehicles", (_req, res) => res.redirect("/api/vehicles"));
app.get("/health", (_req, res) => res.redirect("/api/health"));
app.get("/dashboard", (_req, res) => res.redirect("/api/dashboard/stats"));
app.get("/sales", (_req, res) => res.redirect("/api/sales"));
app.get("/customers", (_req, res) => res.redirect("/api/customers"));

// Health-check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Global 404 handler
app.use((req, res) => {
  if (req.accepts("html") && !req.accepts("json")) {
    res.status(404).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>404 Not Found - AutoDealer Pro</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #e2e8f0; padding: 40px; text-align: center; }
          a { color: #38bdf8; text-decoration: none; font-weight: bold; }
          a:hover { text-decoration: underline; }
          .card { background: #1e293b; padding: 30px; border-radius: 12px; max-width: 580px; margin: 40px auto; border: 1px solid #334155; }
          .btn { background: #2563eb; color: #fff; padding: 10px 20px; border-radius: 6px; display: inline-block; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>🔍 Endpoint Not Found (404)</h2>
          <p>The path <code>${req.path}</code> does not exist on this backend API.</p>
          <p><a class="btn" href="http://localhost:5173">Open Frontend Web App (Port 5173) &rarr;</a></p>
          <p style="margin-top: 20px;"><a href="/">View API Documentation</a> | <a href="/api/vehicles">View Vehicles API</a></p>
        </div>
      </body>
      </html>
    `);
    return;
  }

  res.status(404).json({
    error: "Endpoint not found",
    requestedPath: req.path,
    hint: "All backend API routes are prefixed with /api (e.g. /api/vehicles, /api/health). If you want the visual application, please open the frontend at http://localhost:5173.",
    availableEndpoints: [
      "/",
      "/api/health",
      "/api/vehicles",
      "/api/vehicles/search",
      "/api/dashboard/stats",
      "/api/customers",
      "/api/sales",
      "/api/auth/login",
      "/api/auth/register",
    ],
  });
});

// Start server if not running in a test runner
const isTestEnvironment =
  process.env.NODE_ENV === "test" ||
  process.argv.some((arg) => arg.includes("test"));

if (!isTestEnvironment) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚗 Car Dealership API running on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health`);
  });
}

export default app;
