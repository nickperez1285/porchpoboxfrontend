import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SubscriptionSettings from "./SubscriptionSettings";
import { doc, getDoc } from "firebase/firestore";

jest.mock("../firebase", () => ({
  db: "mock-db",
  auth: {
    currentUser: {
      uid: "u1",
      email: "test@test.com",
      getIdToken: jest.fn().mockResolvedValue("mock-token"),
    },
  },
}));
jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
}));
jest.mock("./PrefLocationModal", () => ({ onDone, required }) => (
  <div data-testid="pref-modal">
    <span>PrefLocationModal required={String(required)}</span>
    <button onClick={onDone}>Mock Done</button>
  </div>
));

const mockPriceIds = {
  monthly: "price_monthly_1",
  semiannual: "price_semiannual_1",
  yearly: "price_yearly_1",
};

const mockUser = { uid: "u1", email: "test@test.com", displayName: "Test" };

const renderSettings = (profileData = {}) => {
  doc.mockImplementation((...segments) =>
    segments.map((s) => (typeof s === "string" ? s : "mock-db")).join("/"),
  );
  getDoc.mockResolvedValue({
    exists: () => true,
    data: () => profileData,
  });

  return render(
    <MemoryRouter>
      <SubscriptionSettings user={mockUser} profileData={profileData} />
    </MemoryRouter>,
  );
};

const configResponse = {
  ok: true,
  json: () => Promise.resolve({ priceIds: mockPriceIds }),
};

const makeResponse = (overrides = {}) => ({
  ok: overrides.ok ?? true,
  json: () => Promise.resolve(overrides.json ?? { success: true }),
  text: () => Promise.resolve(
    overrides.json
      ? JSON.stringify(overrides.json)
      : JSON.stringify({ success: true }),
  ),
});

describe("SubscriptionSettings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, "location", {
      writable: true,
      value: { assign: jest.fn() },
    });
  });

  it("renders the subscription settings header", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(configResponse);
    renderSettings({});
    expect(
      await screen.findByText("Subscription Settings"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Manage plan, renewal, and discounts"),
    ).toBeInTheDocument();
  });

  it("renders all plan options", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(configResponse);
    renderSettings({});
    expect(await screen.findByText("1 Month")).toBeInTheDocument();
    expect(screen.getByText("6 Months")).toBeInTheDocument();
    expect(screen.getByText("1 Year")).toBeInTheDocument();
  });

  it("renders plan prices", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(configResponse);
    renderSettings({});
    expect(await screen.findByText("$20")).toBeInTheDocument();
    expect(screen.getByText("$100")).toBeInTheDocument();
    expect(screen.getByText("$200")).toBeInTheDocument();
  });

  it("renders plan descriptions", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(configResponse);
    renderSettings({});
    expect(
      await screen.findByText("Monthly package receiving"),
    ).toBeInTheDocument();
  });

  it("selects yearly plan by default", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(configResponse);
    renderSettings({});
    const yearlyBtn = await screen.findByText("1 Year");
    expect(yearlyBtn.closest("button")).toHaveClass("subscription-plan--selected");
  });

  it("switches selected plan on click", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(configResponse);
    renderSettings({});
    await screen.findByText("1 Month");
    fireEvent.click(screen.getByText("1 Month"));
    const monthlyBtn = screen.getByText("1 Month").closest("button");
    expect(monthlyBtn).toHaveClass("subscription-plan--selected");
    const yearlyBtn = screen.getByText("1 Year").closest("button");
    expect(yearlyBtn).not.toHaveClass("subscription-plan--selected");
  });

  it("shows Ready to subscribe pill when no stripe subscription", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(configResponse);
    renderSettings({});
    expect(await screen.findByText("Ready to subscribe")).toBeInTheDocument();
  });

  it("shows Auto-renewing pill when subscribed and not cancelling", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(configResponse);
    renderSettings({
      stripeSubscriptionId: "sub_123",
      subscriptionCancelAtPeriodEnd: false,
    });
    expect(await screen.findByText("Auto-renewing")).toBeInTheDocument();
  });

  it("shows Cancels at period end pill when cancelling", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(configResponse);
    renderSettings({
      stripeSubscriptionId: "sub_123",
      subscriptionCancelAtPeriodEnd: true,
    });
    expect(await screen.findByText("Cancels at period end")).toBeInTheDocument();
  });

  it("renders promo code input", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(configResponse);
    renderSettings({});
    expect(await screen.findByPlaceholderText("Enter code")).toBeInTheDocument();
  });

  it("renders Apply button for promo code", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(configResponse);
    renderSettings({});
    expect(await screen.findByText("Apply")).toBeInTheDocument();
  });

  it("shows Apply button text while validating promo", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(configResponse)
      .mockImplementationOnce(() => new Promise(() => {}));

    renderSettings({});
    await screen.findByText("Apply");
    const input = screen.getByPlaceholderText("Enter code");

    fireEvent.change(input, { target: { value: "SAVE20" } });
    fireEvent.click(screen.getByText("Apply"));

    expect(await screen.findByText("Checking...")).toBeInTheDocument();
  });

  it("validates promo code and shows success message", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(configResponse)
      .mockResolvedValueOnce(
        makeResponse({
          json: {
            success: true,
            coupon: { code: "SAVE20", id: "coupon_1" },
          },
        }),
      );

    renderSettings({});
    await screen.findByText("Apply");
    const input = screen.getByPlaceholderText("Enter code");

    fireEvent.change(input, { target: { value: "SAVE20" } });
    fireEvent.click(screen.getByText("Apply"));

    await waitFor(() => {
      expect(screen.getByText(/Promo code applied/i)).toBeInTheDocument();
    });
  });

  it("shows error when promo code validation fails", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(configResponse)
      .mockResolvedValueOnce(
        makeResponse({
          ok: false,
          json: { success: false, message: "Invalid promo code." },
        }),
      );

    renderSettings({});
    await screen.findByText("Apply");
    const input = screen.getByPlaceholderText("Enter code");

    fireEvent.change(input, { target: { value: "BADCODE" } });
    fireEvent.click(screen.getByText("Apply"));

    expect(await screen.findByText("Invalid promo code.")).toBeInTheDocument();
  });

  it("shows error when promo code field is empty", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(configResponse);
    renderSettings({});
    await screen.findByText("Apply");
    fireEvent.click(screen.getByText("Apply"));

    expect(
      await screen.findByText("Enter a promo code first."),
    ).toBeInTheDocument();
  });

  it("shows Buy Yearly Plan button by default", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(configResponse);
    renderSettings({});
    expect(await screen.findByText("Buy 1 Year")).toBeInTheDocument();
  });

  it("shows Buy 1 Month after selecting monthly", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(configResponse);
    renderSettings({});
    await screen.findByText("1 Month");
    fireEvent.click(screen.getByText("1 Month"));
    expect(screen.getByText("Buy 1 Month")).toBeInTheDocument();
  });

  it("shows error when pricing not loaded and checkout clicked", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(
      makeResponse({
        json: { priceIds: { monthly: "", semiannual: "", yearly: "" } },
      }),
    );

    renderSettings({});
    await screen.findByText("Buy 1 Year");
    fireEvent.click(screen.getByText("Buy 1 Year"));

    expect(
      await screen.findByText("Pricing configuration not loaded. Try again."),
    ).toBeInTheDocument();
  });

  it("shows prefLocation modal when user has no preferred location", async () => {
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({}),
    });

    global.fetch = jest.fn().mockResolvedValueOnce(configResponse);

    renderSettings({});
    await act(async () => {});
    fireEvent.click(screen.getByText("Buy 1 Year"));

    expect(await screen.findByTestId("pref-modal")).toBeInTheDocument();
  });

  it("shows Opening Stripe text during checkout", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(configResponse)
      .mockImplementationOnce(() => new Promise(() => {}));

    renderSettings({ prefLocation: { id: "p1" } });
    await act(async () => {});
    fireEvent.click(screen.getByText("Buy 1 Year"));

    expect(await screen.findByText("Opening Stripe...")).toBeInTheDocument();
  });

  it("redirects to Stripe on successful checkout", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(configResponse)
      .mockResolvedValueOnce(
        makeResponse({
          json: { url: "https://checkout.stripe.com/test" },
        }),
      );

    renderSettings({ prefLocation: { id: "p1" } });
    await act(async () => {});

    // Wait for config fetch to complete so priceId is populated
    expect(screen.getByText("Buy 1 Year")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Buy 1 Year"));

    await waitFor(() => {
      expect(window.location.assign).toHaveBeenCalledWith(
        "https://checkout.stripe.com/test",
      );
    });
  });

  it("shows error when checkout fails", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(configResponse)
      .mockResolvedValueOnce(
        makeResponse({
          ok: false,
          json: { message: "Checkout failed" },
        }),
      );

    renderSettings({ prefLocation: { id: "p1" } });
    await act(async () => {});
    fireEvent.click(screen.getByText("Buy 1 Year"));

    expect(await screen.findByText("Checkout failed")).toBeInTheDocument();
  });

  it("shows Cancel at Period End button when subscribed and not cancelling", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(configResponse);
    renderSettings({
      stripeSubscriptionId: "sub_123",
      subscriptionCancelAtPeriodEnd: false,
    });
    expect(
      await screen.findByText("Cancel at Period End"),
    ).toBeInTheDocument();
  });

  it("shows Keep Auto-Renewal button when cancelling", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(configResponse);
    renderSettings({
      stripeSubscriptionId: "sub_123",
      subscriptionCancelAtPeriodEnd: true,
    });
    expect(
      await screen.findByText("Keep Auto-Renewal"),
    ).toBeInTheDocument();
  });

  it("shows success message after cancelling subscription", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(configResponse)
      .mockResolvedValueOnce(
        makeResponse({
          json: { success: true },
        }),
      );

    renderSettings({
      stripeSubscriptionId: "sub_123",
      subscriptionCancelAtPeriodEnd: false,
    });
    await screen.findByText("Cancel at Period End");

    fireEvent.click(screen.getByText("Cancel at Period End"));

    expect(
      await screen.findByText(
        "Your subscription is set to cancel at the end of the current period.",
      ),
    ).toBeInTheDocument();
  });

  it("shows success message after resuming subscription", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(configResponse)
      .mockResolvedValueOnce(
        makeResponse({
          json: { success: true },
        }),
      );

    renderSettings({
      stripeSubscriptionId: "sub_123",
      subscriptionCancelAtPeriodEnd: true,
    });
    await screen.findByText("Keep Auto-Renewal");

    fireEvent.click(screen.getByText("Keep Auto-Renewal"));

    expect(
      await screen.findByText("Auto-renewal is back on for this subscription."),
    ).toBeInTheDocument();
  });

  it("shows error when cancellation API fails", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(configResponse)
      .mockResolvedValueOnce(
        makeResponse({
          ok: false,
          json: { success: false, message: "API error" },
        }),
      );

    renderSettings({
      stripeSubscriptionId: "sub_123",
      subscriptionCancelAtPeriodEnd: false,
    });
    await screen.findByText("Cancel at Period End");

    fireEvent.click(screen.getByText("Cancel at Period End"));

    expect(await screen.findByText("API error")).toBeInTheDocument();
  });

  it("does not show Cancel at Period End when not subscribed", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(configResponse);
    renderSettings({});
    expect(
      screen.queryByText("Cancel at Period End"),
    ).not.toBeInTheDocument();
  });

  it("does not show Keep Auto-Renewal when not subscribed", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(configResponse);
    renderSettings({});
    expect(
      screen.queryByText("Keep Auto-Renewal"),
    ).not.toBeInTheDocument();
  });

  it("hides Cancel at Period End button while cancelling", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(configResponse)
      .mockImplementationOnce(() => new Promise(() => {}));

    renderSettings({
      stripeSubscriptionId: "sub_123",
      subscriptionCancelAtPeriodEnd: false,
    });
    await screen.findByText("Cancel at Period End");

    fireEvent.click(screen.getByText("Cancel at Period End"));
    expect(await screen.findByText("Updating...")).toBeInTheDocument();
    expect(screen.getByText("Updating...")).toBeDisabled();
  });
});
