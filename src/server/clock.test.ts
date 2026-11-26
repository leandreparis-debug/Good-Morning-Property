import { describe, expect, it } from "vitest";
import { isFakeNowAllowed, resolveNow } from "./clock";

const real = new Date("2026-11-26T12:00:00Z");
const FAKE = "2099-01-07T10:00:00Z";

describe("resolveNow", () => {
  it("returns the real time without APP_FAKE_NOW", () => {
    expect(resolveNow({ NODE_ENV: "development" }, real)).toBe(real);
  });

  it("uses APP_FAKE_NOW in development and test", () => {
    expect(resolveNow({ NODE_ENV: "development", APP_FAKE_NOW: FAKE }, real).toISOString()).toBe(
      "2099-01-07T10:00:00.000Z",
    );
    expect(resolveNow({ NODE_ENV: "test", APP_FAKE_NOW: FAKE }, real).toISOString()).toBe(
      "2099-01-07T10:00:00.000Z",
    );
  });

  it("ignores APP_FAKE_NOW in production", () => {
    expect(resolveNow({ NODE_ENV: "production", APP_FAKE_NOW: FAKE }, real)).toBe(real);
  });

  it("ignores APP_FAKE_NOW on Vercel production, even with APP_E2E", () => {
    expect(
      resolveNow(
        { NODE_ENV: "production", VERCEL_ENV: "production", APP_E2E: "1", APP_FAKE_NOW: FAKE },
        real,
      ),
    ).toBe(real);
    expect(resolveNow({ VERCEL_ENV: "production", APP_FAKE_NOW: FAKE }, real)).toBe(real);
  });

  it("allows the e2e suite to fake time on a local production build", () => {
    expect(isFakeNowAllowed({ NODE_ENV: "production", APP_E2E: "1" })).toBe(true);
    expect(isFakeNowAllowed({ NODE_ENV: "production", APP_E2E: "0" })).toBe(false);
  });

  it("rejects an invalid date", () => {
    expect(() => resolveNow({ NODE_ENV: "development", APP_FAKE_NOW: "demain" }, real)).toThrow(
      /APP_FAKE_NOW invalide/,
    );
  });
});
