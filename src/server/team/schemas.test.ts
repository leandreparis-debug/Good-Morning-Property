import { describe, expect, it } from "vitest";
import { addMemberSchema, placeholderEmail, setLeadSchema, updateMemberSchema } from "./schemas";

describe("addMemberSchema", () => {
  it("normalises a valid entry", () => {
    expect(
      addMemberSchema.parse({
        displayName: "  Membre Démo 6 ",
        initials: "md6",
        avatarColor: "grass",
        email: " Membre6@Example.TEST ",
      }),
    ).toEqual({
      displayName: "Membre Démo 6",
      initials: "MD6",
      avatarColor: "grass",
      email: "membre6@example.test",
    });
  });

  it("makes the email optional", () => {
    const parsed = addMemberSchema.parse({
      displayName: "X",
      initials: "X",
      avatarColor: "sun",
      email: "",
    });
    expect(parsed.email).toBeUndefined();
  });

  it.each([
    [{ displayName: "   " }, "Le nom est obligatoire."],
    [{ displayName: "x".repeat(61) }, "Le nom : 60 caractères maximum."],
    [{ initials: "ABCD" }, "3 caractères maximum pour les initiales."],
    [{ initials: "A B" }, "Pas d'espace dans les initiales."],
    [{ email: "pas-un-mail" }, "Adresse mail invalide."],
  ])("rejects %j", (patch, message) => {
    const result = addMemberSchema.safeParse({
      displayName: "X",
      initials: "X",
      avatarColor: "sun",
      email: "",
      ...patch,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(message);
  });

  it("rejects an unknown colour", () => {
    expect(
      addMemberSchema.safeParse({ displayName: "X", initials: "X", avatarColor: "red", email: "" })
        .success,
    ).toBe(false);
  });
});

describe("other schemas", () => {
  it("updateMemberSchema requires a uuid", () => {
    expect(
      updateMemberSchema.safeParse({
        memberId: "nope",
        displayName: "X",
        initials: "X",
        avatarColor: "sun",
      }).success,
    ).toBe(false);
  });

  it("setLeadSchema accepts null (nobody)", () => {
    expect(setLeadSchema.parse({ memberId: null })).toEqual({ memberId: null });
  });

  it("placeholderEmail uses the reserved .invalid domain", () => {
    expect(placeholderEmail("ab12cd34")).toBe("membre-ab12cd34@good-morning.invalid");
  });
});
