import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import authRoutes from "./modules/auth/authRoutes.js";
import procurementRoutes from "./modules/procurement/procurementRoutes.js";
import publicAuctionRoutes from "./modules/procurement/publicAuctionRoutes.js";
import adminRoutes from "./modules/admin/adminRoutes.js";
import pool from "./config/db.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();

const app = express();

app.use(helmet());

const allowedClientOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedClientOrigins.includes(origin)) return callback(null, true)

    // Vite may use localhost, 127.0.0.1, or a different port during development.
    if (process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(origin)) {
      return callback(null, true)
    }

    return callback(new Error('Origin is not allowed by CORS.'))
  },
}));

app.use(express.json({ limit: "1mb" }));
app.use("/uploads", (req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
}, express.static(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../uploads"), { fallthrough: false, maxAge: "1h" }));

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({
      message: "Addis Chereta API is running",
      database: "connected",
    });
  } catch (error) {
    console.error("Database health check failed:", error.code || "unknown", error.message);
    res.status(503).json({
      message: "The API is running, but the database connection failed.",
      database: "disconnected",
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/auctions", publicAuctionRoutes);
app.use("/api/procurement", procurementRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});

export default app;
