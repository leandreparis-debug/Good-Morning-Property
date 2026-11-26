import { describe, expect, it } from "vitest";
import { EnvError, parseEnv } from "./env";

describe("parseEnv", () => {
  it("accepts a valid environment", () => {
    expect(parseEnv({ NODE_ENV: "test", NEXT_PUBLIC_APP_URL: "http://localhost:3000" })).toEqual({
      NODE_ENV: "test",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    });
  });

  it("rejects a missing required variable with a clear message", () => {
    expect(() => parseEnv({ NODE_ENV: "test" })).toThrow(EnvError);
    expect(() => parseEnv({ NODE_ENV: "test" })).toThrow(/NEXT_PUBLIC_APP_URL : manquante/);
    expect(() => parseEnv({ NODE_ENV: "test" })).toThrow(/\.env\.example/);
  });

  it("rejects an invalid value", () => {
    expect(() => parseEnv({ NEXT_PUBLIC_APP_URL: "pas-une-url" })).toThrow(
      /NEXT_PUBLIC_APP_URL : doit être une URL complète/,
    );
  });
});
