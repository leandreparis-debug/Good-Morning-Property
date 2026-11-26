import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemberAvatar } from "./MemberAvatar";

describe("MemberAvatar", () => {
  it("shows the initials and is named after the member", () => {
    render(<MemberAvatar name="Alice Martin" />);
    const avatar = screen.getByRole("img", { name: "Alice Martin" });
    expect(avatar).toHaveTextContent("AM");
    expect(avatar).toHaveAttribute("data-status", "idle");
  });

  it("current status adds the double ring and announces it", () => {
    render(<MemberAvatar name="Bruno Petit" status="current" />);
    const avatar = screen.getByRole("img", { name: "Bruno Petit, en cours" });
    expect(avatar).toHaveAttribute("data-status", "current");
    expect(avatar.className).toContain(
      "shadow-[0_0_0_4px_var(--color-card),0_0_0_6px_var(--color-ink)]",
    );
  });

  it("done status is faded", () => {
    render(<MemberAvatar name="Chloé Bernard" status="done" />);
    expect(screen.getByRole("img", { name: "Chloé Bernard, déjà passé" })).toHaveClass(
      "opacity-45",
    );
  });

  it("uses white text on ink", () => {
    render(<MemberAvatar name="Emma Leroy" color="ink" />);
    expect(screen.getByRole("img")).toHaveClass("bg-ink", "text-white");
  });
});
