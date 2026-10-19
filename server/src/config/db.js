import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true"
    ? { rejectUnauthorized: true }
    : false,
});

pool.on("error", (error) => {
  console.error("Unexpected database error:", error);
});

export default pool;
