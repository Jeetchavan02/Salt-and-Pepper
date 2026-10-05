import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  register,
  login,
  health,
  adminUsersDemo,
  hashDemoTwoCases,
} from "../controllers/authController";

const router = Router();

// ─── Rate limiting ────────────────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: "Too many registration attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Routes ───────────────────────────────────────────────────────────────────
router.get("/health", health);
router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);

// Dev-only: demo DB view
router.get("/admin/users-demo", adminUsersDemo);

// Dev-only: two-case hash comparison demo (match vs no-match)
router.post("/demo/hash-cases", hashDemoTwoCases);

export default router;
