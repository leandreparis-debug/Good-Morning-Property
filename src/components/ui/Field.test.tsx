import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Field } from "./Field";

describe("Field", () => {
  it("links label, hint and error", () => {
    render(<Field label="Lieu" hint="Ville ou adresse" error="Obligatoire" />);
    const input = screen.getByLabelText("Lieu");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Ville ou adresse Obligatoire");
  });

  it("is valid without error", () => {
    render(<Field label="Lieu" />);
    expect(screen.getByLabelText("Lieu")).not.toHaveAttribute("aria-invalid");
  });
});
