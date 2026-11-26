import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DisplayTitle } from "./DisplayTitle";

describe("DisplayTitle", () => {
  it("sets the chosen word in italics", () => {
    render(<DisplayTitle italic="commence">Qui commence ?</DisplayTitle>);
    const heading = screen.getByRole("heading", { level: 1, name: "Qui commence ?" });
    expect(heading.querySelector("em")).toHaveTextContent("commence");
  });
});
