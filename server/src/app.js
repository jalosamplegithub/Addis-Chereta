import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import authRoutes from "./modules/auth/authRoutes.js";
import pool from "./config/db.js";

dotenv.config();

const app = express();

app.use(helmet());

app.use(cors({
  origin: process.env.CLIENT_URL,
}));

app.use(express.json({ limit: "1mb" }));

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

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});

export default app;
