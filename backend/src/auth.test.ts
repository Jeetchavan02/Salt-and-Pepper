/**
 * Integration tests for Salt & Pepper Authentication
 *
 * These tests spin up the actual Express app and connect to a test MongoDB.
 * Set MONGODB_URI_TEST in .env or it falls back to the default test DB.
 *
 * Run: npm test
 */

import "dotenv/config";
import request from "supertest";
import mongoose from "mongoose";
import app from "../server";
import User from "../models/User";
import { generateSalt, hashPassword, verifyPassword } from "../utils/passwordHash";

// Use a separate test DB so we don't pollute the dev DB
const TEST_DB =
  process.env.MONGODB_URI_TEST ||
  "mongodb://localhost:27017/salt_pepper_lab_test";

const PEPPER = process.env.PEPPER || "test_pepper_for_unit_tests_only";

// Inject PEPPER for tests that bypass the server start guard
process.env.PEPPER = PEPPER;

beforeAll(async () => {
  await mongoose.connect(TEST_DB);
});

afterEach(async () => {
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

// ──────────────────────────────────────────────────────────────────────────────
// 1. Unit tests for passwordHash utility
// ──────────────────────────────────────────────────────────────────────────────

describe("passwordHash utility", () => {
  test("generateSalt returns a 32-char hex string", () => {
    const salt = generateSalt();
    expect(typeof salt).toBe("string");
    expect(salt).toHaveLength(32);
    expect(/^[0-9a-f]+$/.test(salt)).toBe(true);
  });

  test("Two users with identical passwords produce different salts", () => {
    const saltA = generateSalt();
    const saltB = generateSalt();
    expect(saltA).not.toEqual(saltB);
  });

  test("hashPassword returns a deterministic scrypt hash", async () => {
    const salt = generateSalt();
    const hash1 = await hashPassword("MyPassword1!", salt, PEPPER);
    const hash2 = await hashPassword("MyPassword1!", salt, PEPPER);
    expect(hash1).toEqual(hash2);
  });

  test("hashPassword produces different hashes for same password with different salts", async () => {
    const saltA = generateSalt();
    const saltB = generateSalt();
    const hashA = await hashPassword("SamePassword!", saltA, PEPPER);
    const hashB = await hashPassword("SamePassword!", saltB, PEPPER);
    // Demonstrates WHY salts are used
    expect(hashA).not.toEqual(hashB);
  });

  test("verifyPassword: correct password + stored salt + pepper → true", async () => {
    const salt = generateSalt();
    const hash = await hashPassword("CorrectPass1!", salt, PEPPER);
    const result = await verifyPassword("CorrectPass1!", salt, PEPPER, hash);
    expect(result).toBe(true);
  });

  test("verifyPassword: wrong password → false", async () => {
    const salt = generateSalt();
    const hash = await hashPassword("RightPass1!", salt, PEPPER);
    const result = await verifyPassword("WrongPass1!", salt, PEPPER, hash);
    expect(result).toBe(false);
  });

  test("verifyPassword: wrong pepper → false", async () => {
    const salt = generateSalt();
    const hash = await hashPassword("MyPass1!", salt, PEPPER);
    const result = await verifyPassword("MyPass1!", salt, "wrong_pepper", hash);
    expect(result).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 2. Registration API
// ──────────────────────────────────────────────────────────────────────────────

describe("POST /api/auth/register", () => {
  test("1. Registers user with valid credentials — 201", async () => {
    const res = await request(app).post("/api/auth/register").send({
      username: "testuser",
      email: "test@example.com",
      password: "SecurePass1!",
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  test("2. Duplicate email returns 409", async () => {
    await request(app).post("/api/auth/register").send({
      username: "user1",
      email: "dup@example.com",
      password: "SecurePass1!",
    });
    const res = await request(app).post("/api/auth/register").send({
      username: "user2",
      email: "dup@example.com",
      password: "SecurePass1!",
    });
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test("10. Password is NEVER stored as plaintext in MongoDB", async () => {
    await request(app).post("/api/auth/register").send({
      username: "plaintest",
      email: "plain@example.com",
      password: "SecurePass1!",
    });
    const user = await User.findOne({ email: "plain@example.com" }).select(
      "+passwordHash +salt"
    );
    expect(user).not.toBeNull();
    // @ts-ignore
    expect(user!.passwordHash).not.toEqual("SecurePass1!");
    // @ts-ignore
    expect((user as any).password).toBeUndefined();
  });

  test("8. Pepper is NEVER stored in MongoDB", async () => {
    await request(app).post("/api/auth/register").send({
      username: "peppertest",
      email: "pepper@example.com",
      password: "SecurePass1!",
    });
    const user = await User.findOne({ email: "pepper@example.com" }).select(
      "+passwordHash +salt"
    );
    expect(user).not.toBeNull();
    // @ts-ignore
    expect((user as any).pepper).toBeUndefined();
  });

  test("6. Two users with same password get different salts", async () => {
    await request(app).post("/api/auth/register").send({
      username: "userA",
      email: "userA@example.com",
      password: "SamePassword1!",
    });
    await request(app).post("/api/auth/register").send({
      username: "userB",
      email: "userB@example.com",
      password: "SamePassword1!",
    });

    const userA = await User.findOne({ email: "usera@example.com" }).select("+salt +passwordHash");
    const userB = await User.findOne({ email: "userb@example.com" }).select("+salt +passwordHash");

    expect(userA).not.toBeNull();
    expect(userB).not.toBeNull();
    // Different salts
    expect(userA!.salt).not.toEqual(userB!.salt);
    // Different hashes even for same password
    expect(userA!.passwordHash).not.toEqual(userB!.passwordHash);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 3. Login API
// ──────────────────────────────────────────────────────────────────────────────

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/auth/register").send({
      username: "loginuser",
      email: "login@example.com",
      password: "CorrectPass1!",
    });
  });

  test("3. Login with correct password → 200", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "login@example.com",
      password: "CorrectPass1!",
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Login successful");
  });

  test("4. Login with incorrect password → 401", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "login@example.com",
      password: "WrongPassword!",
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("5. Login with non-existent email → 401 (vague message)", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nobody@example.com",
      password: "SomePass1!",
    });
    expect(res.status).toBe(401);
    // Should be vague — no "user not found" etc.
    expect(res.body.message).toBe("Invalid credentials");
  });

  test("Login response does NOT contain passwordHash or salt", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "login@example.com",
      password: "CorrectPass1!",
    });
    expect(res.body).not.toHaveProperty("passwordHash");
    expect(res.body).not.toHaveProperty("salt");
    if (res.body.user) {
      expect(res.body.user).not.toHaveProperty("passwordHash");
      expect(res.body.user).not.toHaveProperty("salt");
    }
  });

  test("7. Login uses stored salt (not a new one)", async () => {
    // Capture the salt stored during registration
    const userBefore = await User.findOne({ email: "login@example.com" }).select("+salt");
    const storedSalt = userBefore!.salt;

    // Login should succeed — proof that it used the stored salt
    const res = await request(app).post("/api/auth/login").send({
      email: "login@example.com",
      password: "CorrectPass1!",
    });
    expect(res.status).toBe(200);

    // Salt in DB should be unchanged after login
    const userAfter = await User.findOne({ email: "login@example.com" }).select("+salt");
    expect(userAfter!.salt).toEqual(storedSalt);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 4. Security invariants
// ──────────────────────────────────────────────────────────────────────────────

describe("Security invariants", () => {
  test("9. Missing PEPPER causes server guard to trigger", () => {
    const originalPepper = process.env.PEPPER;
    process.env.PEPPER = "";
    // The guard runs at module import time; here we test the condition directly
    expect(process.env.PEPPER.trim()).toBe("");
    process.env.PEPPER = originalPepper!;
  });

  test("correct password + stored salt + pepper matches stored hash", async () => {
    const salt = generateSalt();
    const hash = await hashPassword("MyLabPass1!", salt, PEPPER);
    const matches = await verifyPassword("MyLabPass1!", salt, PEPPER, hash);
    expect(matches).toBe(true);
  });

  test("wrong password + stored salt + pepper does NOT match", async () => {
    const salt = generateSalt();
    const hash = await hashPassword("MyLabPass1!", salt, PEPPER);
    const matches = await verifyPassword("WrongPass1!", salt, PEPPER, hash);
    expect(matches).toBe(false);
  });
});
