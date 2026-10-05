import crypto from "crypto";

/**
 * Generate a cryptographically secure random salt.
 * Uses Node.js crypto.randomBytes — never Math.random().
 * Returns a 32-character hex string (16 random bytes).
 */
export function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Hash a password using Node's scrypt algorithm combined with salt and pepper.
 *
 * The input fed into scrypt is:  password + salt + pepper
 * The scrypt "salt" parameter is the same salt (used for KDF strengthening).
 *
 * This means:
 *  - Two users with the same password but different salts → different hashes.
 *  - An attacker who steals the DB (passwordHash + salt) still cannot reverse
 *    the hash without the pepper, which lives only in the server environment.
 *
 * @param password  - plaintext password (received from client, never stored)
 * @param salt      - per-user random salt (stored in DB)
 * @param pepper    - server-side secret from process.env.PEPPER (never stored)
 * @returns         - hex-encoded scrypt hash (128 chars = 64 bytes)
 */
export async function hashPassword(
  password: string,
  salt: string,
  pepper: string
): Promise<string> {
  // Combine password + salt + pepper into a single string before hashing.
  // This is the core of the salt-and-pepper technique.
  const combined = password + salt + pepper;

  return new Promise((resolve, reject) => {
    // scrypt parameters: N=16384, r=8, p=1 are OWASP-recommended minimums.
    // keylen=64 → 128-char hex output.
    crypto.scrypt(combined, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(derivedKey.toString("hex"));
    });
  });
}

/**
 * Verify a submitted password against a stored hash.
 *
 * Login flow:
 *   submittedPassword + storedSalt + serverPepper → scrypt → compare with storedHash
 *
 * Uses crypto.timingSafeEqual to prevent timing-based side-channel attacks.
 *
 * @param submittedPassword - plaintext password from login form
 * @param storedSalt        - salt fetched from MongoDB (not regenerated)
 * @param pepper            - server-side secret from process.env.PEPPER
 * @param storedHash        - passwordHash fetched from MongoDB
 * @returns                 - true if credentials are correct, false otherwise
 */
export async function verifyPassword(
  submittedPassword: string,
  storedSalt: string,
  pepper: string,
  storedHash: string
): Promise<boolean> {
  // Recompute: submittedPassword + storedSalt + pepper — using the STORED salt.
  // Never generate a new salt here.
  const recomputedHash = await hashPassword(submittedPassword, storedSalt, pepper);

  // Convert both hashes to Buffers for constant-time comparison.
  // If buffer lengths differ, crypto.timingSafeEqual throws — guard against it.
  const recomputedBuf = Buffer.from(recomputedHash, "hex");
  const storedBuf = Buffer.from(storedHash, "hex");

  if (recomputedBuf.length !== storedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(recomputedBuf, storedBuf);
}
