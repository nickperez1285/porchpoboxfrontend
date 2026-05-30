import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CheckoutSuccess from "./CheckoutSuccess";
import { apiGet } from "../utils/apiClient";

jest.mock("../firebase", () => ({
  auth: {
    currentUser: {
      uid: "u1",
      email: "test@test.com",
      displayName: "Test User",
      getIdToken: jest.fn().mockResolvedValue("mock-token"),
    },
  },
}));
jest.mock("../utils/apiClient", () => ({
  apiGet: jest.fn(),
}));
jest.mock("../config/api", () => ({
  getApiUrl: (path) => `http://localhost:5000${path}`,
}));

const mockSession = {
  payment_status: "paid",
  mode: "subscription",
  status: "complete",
};

const mockFinalizeResponse = {
  success: true,
  subscribedAt: new Date("2026-01-15T00:00:00Z"),
  subscriptionEndsAt: new Date("2027-01-15T00:00:00Z"),
};

const defaultUser = {
  uid: "u1",
  email: "test@test.com",
  displayName: "Test User",
};

const renderSuccess = (overrides = {}) => {
  const sessionId = "sessionId" in overrides ? overrides.sessionId : "cs_test_123";
  const entry =
    sessionId != null
      ? `/checkout-success?session_id=${sessionId}`
      : "/checkout-success";
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <CheckoutSuccess
        user={overrides.user ?? defaultUser}
        authLoading={overrides.authLoading ?? false}
      />
    </MemoryRouter>,
  );
};

describe("CheckoutSuccess", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    apiGet.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, session: mockSession }),
    });

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockFinalizeResponse),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });
  });

  it("shows loading state while verifying payment", () => {
    apiGet.mockImplementation(() => new Promise(() => {}));
    renderSuccess();
    expect(screen.getByText("Verifying your payment...")).toBeInTheDocument();
  });

  it("shows loading state when authLoading is true", () => {
    renderSuccess({ authLoading: true });
    expect(screen.getByText("Verifying your payment...")).toBeInTheDocument();
  });

  it("shows error when session_id is missing", async () => {
    renderSuccess({ sessionId: null });
    expect(
      await screen.findByText("Missing checkout session."),
    ).toBeInTheDocument();
  });

  it("shows error when API verification fails", async () => {
    apiGet.mockResolvedValue({
      ok: false,
      json: () =>
        Promise.resolve({
          success: false,
          message: "Unable to verify checkout session.",
        }),
    });
    renderSuccess();
    expect(
      await screen.findByText("Unable to verify checkout session."),
    ).toBeInTheDocument();
  });

  it("shows error when payment has not completed", async () => {
    apiGet.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          session: {
            payment_status: "unpaid",
            mode: "subscription",
            status: "incomplete",
          },
        }),
    });
    renderSuccess();
    expect(
      await screen.findByText("Payment has not completed yet.", {}, { timeout: 5000 }),
    ).toBeInTheDocument();
  });

  it("shows error when finalize fails", async () => {
    global.fetch
      .mockReset()
      .mockResolvedValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({
            success: false,
            message: "Unable to activate subscription.",
          }),
      });
    renderSuccess();
    expect(
      await screen.findByText("Unable to activate subscription."),
    ).toBeInTheDocument();
  });

  it("shows success state with subscription confirmed", async () => {
    renderSuccess();
    expect(
      await screen.findByText("Subscription Confirmed"),
    ).toBeInTheDocument();
  });

  it("shows You're all set message on success", async () => {
    renderSuccess();
    expect(
      await screen.findByText(/You're all set/),
    ).toBeInTheDocument();
  });

  it("shows user first name in greeting", async () => {
    renderSuccess();
    expect(
      await screen.findByText(/Test!/),
    ).toBeInTheDocument();
  });

  it("shows Active status in summary", async () => {
    renderSuccess();
    expect(await screen.findByText(/Active/)).toBeInTheDocument();
  });

  it("shows subscription dates in summary", async () => {
    renderSuccess();
    expect(
      await screen.findByText((content) => content.includes("Subscription Details")),
    ).toBeInTheDocument();
    expect(await screen.findByText("Valid Through")).toBeInTheDocument();
  });

  it("shows What's Next section", async () => {
    renderSuccess();
    expect(await screen.findByText("What's Next")).toBeInTheDocument();
  });

  it("shows next steps with icons", async () => {
    renderSuccess();
    expect(
      await screen.findByText(/Make sure your preferred partner location is set/),
    ).toBeInTheDocument();
  });

  it("renders View My Profile link", async () => {
    renderSuccess();
    expect(
      await screen.findByText("View My Profile"),
    ).toBeInTheDocument();
  });

  it("renders Return Home link on success", async () => {
    renderSuccess();
    const links = await screen.findAllByText("Return Home");
    expect(links.length).toBeGreaterThan(0);
  });

  it("shows confirmation email text", async () => {
    renderSuccess();
    expect(
      await screen.findByText(/confirmation email has been sent/),
    ).toBeInTheDocument();
  });

  it("sends welcome email on success", async () => {
    renderSuccess();
    await screen.findByText("Subscription Confirmed");

    await waitFor(() => {
      expect(global.fetch.mock.calls[1][0]).toBe(
        "http://localhost:5000/api/notifications/welcome",
      );
      expect(global.fetch.mock.calls[1][1]).toMatchObject({
        method: "POST",
        body: expect.stringContaining("test@test.com"),
      });
    });
  });

  it("shows error state with contact email", async () => {
    apiGet.mockResolvedValue({
      ok: false,
      json: () =>
        Promise.resolve({
          success: false,
          message: "Verification failed",
        }),
    });
    renderSuccess();
    expect(await screen.findByText("Verification failed")).toBeInTheDocument();
    expect(
      screen.getByText("contact@porchpobox.com"),
    ).toBeInTheDocument();
  });

  it("shows Return Home link on error", async () => {
    renderSuccess({ sessionId: null });
    expect(
      await screen.findByText("Return Home"),
    ).toBeInTheDocument();
  });

  it("displays Not available for missing dates", async () => {
    global.fetch
      .mockReset()
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            subscribedAt: null,
            subscriptionEndsAt: null,
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });
    renderSuccess();
    await screen.findByText("Subscription Confirmed");
    const notAvail = screen.getAllByText("Not available");
    expect(notAvail.length).toBeGreaterThan(0);
  });
});
