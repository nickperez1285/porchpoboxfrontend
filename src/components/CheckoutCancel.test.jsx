import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CheckoutCancel from "./CheckoutCancel";

const renderCancel = () =>
  render(
    <MemoryRouter>
      <CheckoutCancel />
    </MemoryRouter>,
  );

describe("CheckoutCancel", () => {
  it('renders "Checkout Canceled" heading', () => {
    renderCancel();
    expect(screen.getByText("Checkout Canceled")).toBeInTheDocument();
  });

  it("explains that no changes were made", () => {
    renderCancel();
    expect(
      screen.getByText(
        "Your subscription checkout was canceled. No changes were made to your account.",
      ),
    ).toBeInTheDocument();
  });

  it("renders Return Home link", () => {
    renderCancel();
    const link = screen.getByText("Return Home");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("href", "/");
  });
});
