import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import { connectDB } from "./config/db";
import authRoutes from "./routes/authRoutes";
import { errorHandler } from "./middleware/errorHandler";

// ─── Guard: PEPPER must be present before the server can start ─────────────
if (!process.env.PEPPER || process.env.PEPPER.trim() === "") {
  console.error(
    "❌  FATAL: PEPPER environment variable is not set.\n" +
      "   Copy .env.example to .env and set a strong random PEPPER value.\n" +
      "   The server cannot start without a pepper — refusing to run."
  );
  process.exit(1);
}

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5001;

const app = express();

// ─── Security headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS — allow only the frontend origin, not wildcard ─────────────────────
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173").split(",");
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server calls (no origin header) only in dev
      if (!origin && process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      if (origin && allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀  Salt & Pepper API running at http://localhost:${PORT}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || "development"}`);
    console.log("   PEPPER  : [loaded from .env — never logged]");
  });
}

start();

export default app; // exported for tests
