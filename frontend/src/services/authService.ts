import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "/api/auth";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
  withCredentials: true,
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  // confirmPassword is validated on the frontend and NEVER sent to the backend
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

export interface DemoUser {
  username: string;
  email: string;
  salt: string;
  passwordHash: string;
  createdAt: string;
}

export interface HashCaseResult {
  label: string;
  passwordUsed: string;
  computedHashPrefix: string;
  matched: boolean;
  verdict: string;
}

export interface HashCasesResponse {
  success: boolean;
  username: string;
  saltPrefix: string;
  storedHashPrefix: string;
  pepperNote: string;
  caseA: HashCaseResult;   // correct password → MATCH
  caseB: HashCaseResult;   // wrong password   → NO MATCH
}

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Sends username, email, password to backend.
 * The backend generates salt SERVER-SIDE (never user-provided),
 * loads pepper from .env, hashes, and stores.
 */
export async function registerUser(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/register", {
    username: payload.username,
    email: payload.email,
    password: payload.password,
    // Note: confirmPassword intentionally excluded — frontend validation only
  });
  return data;
}

/**
 * POST /api/auth/login
 * Sends email and password to backend.
 * The backend fetches stored salt + hash, reconstructs the hash, and compares.
 * The frontend NEVER receives the hash, salt, or pepper.
 */
export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/login", payload);
  return data;
}

/**
 * GET /api/auth/admin/users-demo
 * Development only — fetches user list showing salt and passwordHash.
 * ❌ Never exposes pepper or plaintext passwords.
 */
export async function fetchUsersDemo(): Promise<DemoUser[]> {
  const { data } = await api.get<{ success: boolean; users: DemoUser[] }>("/admin/users-demo");
  return data.users;
}

/**
 * POST /api/auth/demo/hash-cases
 * Development only — runs both cases on the backend:
 *   Case A: correct password + storedSalt + pepper → MATCH  ✅
 *   Case B: wrong password   + storedSalt + pepper → NO MATCH ❌
 * Returns safe prefixes for educational display.
 * ❌ Full pepper is never returned.
 */
export async function runHashCasesDemo(
  email: string,
  password: string,
  wrongPassword: string
): Promise<HashCasesResponse> {
  const { data } = await api.post<HashCasesResponse>("/demo/hash-cases", {
    email,
    password,
    wrongPassword,
  });
  return data;
}

export async function fetchHealth(): Promise<{ success: boolean; message: string }> {
  const { data } = await api.get("/health");
  return data;
}
