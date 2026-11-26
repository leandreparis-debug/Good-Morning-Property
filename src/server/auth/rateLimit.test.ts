import { describe, expect, it } from "vitest";
import { clientIp, createRateLimiter } from "./rateLimit";

describe("createRateLimiter", () => {
  it("blocks after `limit` hits in the window, per key", () => {
    const limiter = createRateLimiter({ limit: 10, windowMs: 60_000 });
    for (let i = 0; i < 10; i++) {
      expect(limiter.isBlocked("1.2.3.4", 1000)).toBe(false);
      limiter.hit("1.2.3.4", 1000);
    }
    expect(limiter.isBlocked("1.2.3.4", 1000)).toBe(true);
    expect(limiter.isBlocked("5.6.7.8", 1000)).toBe(false);
  });

  it("frees the key once the window has passed", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 });
    limiter.hit("ip", 0);
    expect(limiter.isBlocked("ip", 59_999)).toBe(true);
    expect(limiter.isBlocked("ip", 60_000)).toBe(false);
  });
});

describe("clientIp", () => {
  it("takes the first forwarded address", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "10.0.0.1, 10.0.0.2" }))).toBe("10.0.0.1");
    expect(clientIp(new Headers({ "x-real-ip": "10.0.0.3" }))).toBe("10.0.0.3");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
