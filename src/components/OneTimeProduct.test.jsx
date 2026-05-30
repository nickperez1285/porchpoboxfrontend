import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import ProductList from "./OneTimeProduct";
import { getDoc } from "firebase/firestore";
import { auth } from "../firebase";

// Mock Firebase and Firestore
jest.mock("../firebase", () => ({
  db: { __name: "mock-db" },
  auth: {
    currentUser: {
      uid: "test-user-123",
      email: "test@example.com",
      getIdToken: jest.fn().mockResolvedValue("test-token"),
    },
  },
}));

jest.mock("firebase/firestore", () => ({
  getDoc: jest.fn(),
  doc: jest.fn((db, coll, id) => `${coll}/${id}`),
}));

// Mock PrefLocationModal to verify it appears without needing its internal logic
jest.mock("./PrefLocationModal", () => ({ user, onDone, required }) => (
  <div data-testid="pref-modal">
    <h2>Choose Your Preferred Location</h2>
    <button onClick={onDone}>Modal Done</button>
  </div>
));

// Store original env to restore after tests
const originalEnv = process.env;

describe("OneTimeProduct (ProductList)", () => {
  beforeEach(() => {
    auth.currentUser.uid = "test-user-123";
    auth.currentUser.email = "test@example.com";
    auth.currentUser.getIdToken.mockResolvedValue("test-token");

    process.env = {
      ...originalEnv,
      REACT_APP_STRIPE_PRICE_ID_MONTHLY: "price_monthly_123",
      REACT_APP_STRIPE_PRICE_ID_SEMIANNUAL: "price_semi_123",
      REACT_APP_STRIPE_PRICE_ID_YEARLY: "price_yearly_123",
    };

    // Mock fetch for the backend API
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ priceIds: {} }),
    });

    // Mock window.location.assign for the Stripe redirect
    delete window.location;
    window.location = { assign: jest.fn() };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const mockUser = { uid: "test-user-123", email: "test@example.com" };

  it("renders all subscription plans from the configuration", () => {
    render(
      <Router>
        <ProductList user={mockUser} />
      </Router>,
    );

    expect(screen.getByText("1 Month")).toBeInTheDocument();
    expect(screen.getByText("6 Months")).toBeInTheDocument();
    expect(screen.getByText("1 Year")).toBeInTheDocument();
    expect(screen.getByText("$20")).toBeInTheDocument();
  });

  it("shows an error when pricing config is empty", async () => {
    render(
      <Router>
        <ProductList user={mockUser} />
      </Router>,
    );

    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ prefLocation: { id: "loc1" } }),
    });

    const signupBtn = screen.getByText(/Sign Up For 1 Month/i);
    fireEvent.click(signupBtn);

    // The fetch mock returns empty priceIds, so the selected plan has no priceId
    await waitFor(() => {
      expect(
        screen.getByText(/Pricing configuration not loaded/i),
      ).toBeInTheDocument();
    });
  });

  it("initiates checkout when the user has a preferred location set", async () => {
    // Override the default fetch mock to return valid price IDs on the first call
    // and a successful checkout response on the second call.
    const fetchMock = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ priceIds: { monthly: "price_monthly_123", semiannual: "price_semi_123", yearly: "price_yearly_123" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: () =>
          Promise.resolve(JSON.stringify({ url: "https://stripe.com/checkout" })),
      });
    global.fetch = fetchMock;

    render(
      <Router>
        <ProductList user={mockUser} />
      </Router>,
    );

    // User already has a location
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ prefLocation: { id: "loc1" } }),
    });

    // Wait for the stripe-config fetch to resolve
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/stripe-config"),
      );
    });

    await screen.findByText(/Sign Up For 1 Month/i);
    const signupBtn = screen.getByText(/Sign Up For 1 Month/i);
    fireEvent.click(signupBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/create-checkout-session"),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
          body: expect.stringContaining('"priceId":"price_monthly_123"'),
        }),
      );
      expect(window.location.assign).toHaveBeenCalledWith(
        "https://stripe.com/checkout",
      );
    });
  });
});
