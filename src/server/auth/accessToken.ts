import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";

/** 32 random bytes in base64url = 43 characters. */
export const ACCESS_TOKEN_BYTES = 32;

/** Shape of a token as it appears in a link (rejects anything else before hashing). */
export const accessTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);

/** A fresh token and the hash to store. The token itself is never stored. */
export interface GeneratedAccessToken {
  token: string;
  hash: string;
}

/** SHA-256 of a token, lowercase hex (64 characters), the only value stored in the database. */
export function hashAccessToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/** Generates a new personal link token (`crypto.randomBytes`, base64url) and its hash. */
export function generateAccessToken(): GeneratedAccessToken {
  const token = randomBytes(ACCESS_TOKEN_BYTES).toString("base64url");
  return { token, hash: hashAccessToken(token) };
}

/**
 * Constant-time comparison of two hex hashes (no early exit on the first different character).
 * Returns false when lengths differ.
 */
export function hashesMatch(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
