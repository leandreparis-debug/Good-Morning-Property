import { describe, expect, it } from "vitest";
import { visitInputSchema } from "./visitInput";

const schema = visitInputSchema("2026-11-30");

describe("visitInputSchema", () => {
  it("accepts Monday to Sunday of the meeting week and trims", () => {
    for (const date of ["2026-11-30", "2026-12-03", "2026-12-06"]) {
      expect(schema.parse({ visitDate: date, place: " Lyon ", purpose: " Visite " })).toEqual({
        visitDate: date,
        place: "Lyon",
        purpose: "Visite",
      });
    }
  });

  it.each([
    [
      { visitDate: "2026-11-29" },
      "La date doit être comprise dans la semaine de la réunion (du lundi au dimanche).",
    ],
    [
      { visitDate: "2026-12-07" },
      "La date doit être comprise dans la semaine de la réunion (du lundi au dimanche).",
    ],
    [{ visitDate: "" }, "Choisis une date."],
    [{ place: "  " }, "Le lieu est obligatoire."],
    [{ place: "x".repeat(121) }, "Le lieu : 120 caractères maximum."],
    [{ purpose: "" }, "L'objet est obligatoire."],
    [{ purpose: "x".repeat(201) }, "L'objet : 200 caractères maximum."],
  ])("rejects %j", (patch, message) => {
    const result = schema.safeParse({
      visitDate: "2026-12-01",
      place: "Lyon",
      purpose: "Visite",
      ...patch,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(message);
  });

  it("handles a week across the new year", () => {
    const newYear = visitInputSchema("2026-12-28");
    expect(newYear.safeParse({ visitDate: "2027-01-03", place: "A", purpose: "B" }).success).toBe(
      true,
    );
    expect(newYear.safeParse({ visitDate: "2027-01-04", place: "A", purpose: "B" }).success).toBe(
      false,
    );
  });
});
