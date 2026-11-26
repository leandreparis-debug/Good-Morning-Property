import { describe, expect, it } from "vitest";
import { EnvError, parseEnv, parsePublicEnv } from "./env";

const valid = {
  NODE_ENV: "test",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
};

describe("parseEnv", () => {
  it("accepts a valid environment", () => {
    expect(parseEnv(valid)).toEqual(valid);
  });

  it("rejects a missing required variable with a clear message", () => {
    const { NEXT_PUBLIC_APP_URL: _omitted, ...rest } = valid;
    expect(() => parseEnv(rest)).toThrow(EnvError);
    expect(() => parseEnv(rest)).toThrow(/NEXT_PUBLIC_APP_URL : manquante/);
    expect(() => parseEnv(rest)).toThrow(/\.env\.example/);
  });

  it("names every missing Supabase variable", () => {
    const message = (() => {
      try {
        parseEnv({ NEXT_PUBLIC_APP_URL: "http://localhost:3000" });
        return "";
      } catch (error) {
        return error instanceof Error ? error.message : "";
      }
    })();
    expect(message).toContain("NEXT_PUBLIC_SUPABASE_URL : manquante");
    expect(message).toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY : manquante");
    expect(message).toContain("SUPABASE_SERVICE_ROLE_KEY : manquante");
  });

  it("treats an empty value as missing", () => {
    expect(() => parseEnv({ ...valid, SUPABASE_SERVICE_ROLE_KEY: "" })).toThrow(
      /SUPABASE_SERVICE_ROLE_KEY : manquante/,
    );
  });

  it("rejects an invalid value", () => {
    expect(() => parseEnv({ ...valid, NEXT_PUBLIC_APP_URL: "pas-une-url" })).toThrow(
      /NEXT_PUBLIC_APP_URL : doit être une URL complète/,
    );
  });
});

describe("parsePublicEnv", () => {
  it("does not require server secrets", () => {
    const { SUPABASE_SERVICE_ROLE_KEY: _secret, NODE_ENV: _node, ...publicOnly } = valid;
    expect(parsePublicEnv(publicOnly)).toEqual(publicOnly);
  });
});
