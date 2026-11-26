import { describe, expect, it } from "vitest";
import {
  accessTokenSchema,
  generateAccessToken,
  hashAccessToken,
  hashesMatch,
} from "./accessToken";

describe("generateAccessToken", () => {
  it("creates a 43-character base64url token and its SHA-256", () => {
    const { token, hash } = generateAccessToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(accessTokenSchema.safeParse(token).success).toBe(true);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).toBe(hashAccessToken(token));
    expect(hash).not.toContain(token);
  });

  it("never repeats", () => {
    const tokens = new Set(Array.from({ length: 1000 }, () => generateAccessToken().token));
    expect(tokens.size).toBe(1000);
  });
});

describe("hashAccessToken", () => {
  it("is the SHA-256 hex digest", () => {
    expect(hashAccessToken("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });
});

describe("hashesMatch", () => {
  const hash = hashAccessToken("jeton-fictif");

  it("matches identical hashes", () => {
    expect(hashesMatch(hash, hashAccessToken("jeton-fictif"))).toBe(true);
  });

  it("rejects different hashes and different lengths", () => {
    expect(hashesMatch(hash, hashAccessToken("autre"))).toBe(false);
    expect(hashesMatch(hash, hash.slice(1))).toBe(false);
    expect(hashesMatch(hash, "")).toBe(false);
  });
});

describe("accessTokenSchema", () => {
  it.each(["", "trop-court", "a".repeat(44), `${"a".repeat(42)}=`, `${"a".repeat(42)}/`])(
    "rejects %j",
    (value) => {
      expect(accessTokenSchema.safeParse(value).success).toBe(false);
    },
  );
});
