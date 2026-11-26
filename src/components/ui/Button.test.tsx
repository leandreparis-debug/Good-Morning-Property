import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it.each(["primary", "secondary", "soft"] as const)("renders the %s variant", (variant) => {
    render(<Button variant={variant}>Valider</Button>);
    const button = screen.getByRole("button", { name: "Valider" });
    expect(button).toHaveAttribute("data-variant", variant);
    expect(button).toHaveAttribute("type", "button");
  });

  it("primary carries the sun badge, others don't", () => {
    const { container, rerender } = render(<Button>Suivant</Button>);
    expect(container.querySelector(".bg-sun")).not.toBeNull();
    rerender(<Button variant="secondary">Suivant</Button>);
    expect(container.querySelector(".bg-sun")).toBeNull();
  });

  it("calls onClick when enabled", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("is disabled and ignores clicks when disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Go
      </Button>,
    );
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("loading sets aria-busy and disables", () => {
    render(<Button loading>Enregistrer</Button>);
    const button = screen.getByRole("button", { name: "Enregistrer" });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();
  });

  it("has no aria-busy when not loading", () => {
    render(<Button>Enregistrer</Button>);
    expect(screen.getByRole("button")).not.toHaveAttribute("aria-busy");
  });
});
