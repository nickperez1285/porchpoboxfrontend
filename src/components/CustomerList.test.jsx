import React from "react";
import { act, render, screen, waitFor, fireEvent } from "@testing-library/react";
import CustomerList from "./CustomerList";
import {
  collection,
  doc,
  onSnapshot,
  getDoc,
} from "firebase/firestore";
import { apiPost } from "../utils/apiClient";

jest.mock("../firebase", () => ({
  db: { __name: "mock-db" },
  auth: {
    currentUser: {
      getIdToken: jest.fn().mockResolvedValue("test-token"),
    },
  },
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  onSnapshot: jest.fn(),
  getDoc: jest.fn(),
}));

jest.mock("../utils/apiClient", () => ({
  apiPost: jest.fn(),
}));

const createDoc = (id, data) => ({
  id,
  data: () => data,
});

describe("CustomerList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
        text: () => Promise.resolve(""),
      }),
    );
    apiPost.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(""),
    });

    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ status: "trial", name: "Default User", email: "default@test.com" }),
    });

    collection.mockImplementation((...segments) =>
      segments
        .map((segment) => (typeof segment === "string" ? segment : "mock-db"))
        .join("/"),
    );
    doc.mockImplementation((...segments) =>
      segments
        .map((segment) => (typeof segment === "string" ? segment : "mock-db"))
        .join("/"),
    );
  });

  const renderCustomerList = (overrides = {}) => {
    const defaults = {
      count: 1, totalReceived: 1, totalPickedUp: 0,
      name: "Default User", email: "default@test.com",
    };
    return {
      ...defaults,
      ...overrides,
    };
  };

  const setupListWithUser = (userOverrides, userDetailsData) => {
    const userData = renderCustomerList(userOverrides);
    onSnapshot.mockImplementation((target, onNext) => {
      onNext({ docs: [createDoc("u1", userData)] });
      return jest.fn();
    });
    getDoc.mockResolvedValue({
      id: "u1",
      exists: () => true,
      data: () => userDetailsData || { status: userData.status || "" },
    });
  };

  it("shows yellow background for trial user", async () => {
    setupListWithUser(
      { name: "Trial User", email: "trial@test.com" },
      { status: "trial" },
    );

    render(
      <CustomerList vendorId="partner-1" partnerLocationName="Main Street" />,
    );

    const userEl = await screen.findByText("Trial User");
    const li = userEl.closest("li");
    // Wait for userDetails to load and re-render
    await waitFor(() => {
      expect(li).toHaveStyle("background: rgb(255, 246, 191)");
    });
  });

  it("shows yellow background for active status with no subscription", async () => {
    setupListWithUser(
      { name: "Expired User", email: "expired@test.com", status: "active" },
      { status: "active" },
    );

    render(
      <CustomerList vendorId="partner-1" partnerLocationName="Main Street" />,
    );

    const userEl = await screen.findByText("Expired User");
    const li = userEl.closest("li");
    await waitFor(() => {
      expect(li).toHaveStyle("background: rgb(255, 246, 191)");
    });
  });

  it("shows green background for active user with valid subscription", async () => {
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    setupListWithUser(
      { name: "Active Subscriber", email: "active@test.com", status: "active" },
      {
        status: "active",
        stripeSubscriptionId: "sub_123",
        subscriptionEndsAt: futureDate,
      },
    );

    render(
      <CustomerList vendorId="partner-1" partnerLocationName="Main Street" />,
    );

    const userEl = await screen.findByText("Active Subscriber");
    const li = userEl.closest("li");
    await waitFor(() => {
      expect(li).toHaveStyle("background: rgb(212, 237, 218)");
    });
  });

  it("shows pink background for user with unknown status", async () => {
    setupListWithUser(
      { name: "Unknown User", email: "unknown@test.com" },
      {},
    );

    render(
      <CustomerList vendorId="partner-1" partnerLocationName="Main Street" />,
    );

    const userEl = await screen.findByText("Unknown User");
    const li = userEl.closest("li");
    await waitFor(() => {
      expect(li).toHaveStyle("background: rgb(255, 217, 217)");
    });
  });

  it("preserves a zero-count package history document after the last package is delivered", async () => {
    const onPackagesDelivered = jest.fn();

    let packageSnapshotListener;

    onSnapshot.mockImplementation((target, onNext) => {
      packageSnapshotListener = onNext;
      onNext({
        docs: [
          createDoc("user-1", {
            count: 1,
            totalReceived: 1,
            totalPickedUp: 0,
            name: "Casey Customer",
            email: "casey@example.com",
            status: "trial",
          }),
        ],
      });

      return jest.fn();
    });

    render(
      <CustomerList
        vendorId="partner-1"
        partnerLocationName="Main Street"
        onPackagesDelivered={onPackagesDelivered}
      />,
    );

    expect(await screen.findByText("Casey Customer")).toBeInTheDocument();

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    const deliverBtn = await screen.findByRole("button", {
      name: /mark selected as delivered \(1\)/i,
    });
    fireEvent.click(deliverBtn);

    await waitFor(() => {
      expect(apiPost).toHaveBeenCalledWith(
        "/api/notifications/package-delivery",
        expect.objectContaining({
          partnerId: "partner-1",
          partnerName: "Main Street",
          recipients: [
            {
              id: "user-1",
              name: "Casey Customer",
              email: "casey@example.com",
              packageCount: 1,
            },
          ],
        }),
      );
    });

    await waitFor(() => {
      expect(onPackagesDelivered).toHaveBeenCalledWith(1);
    });

    act(() => {
      packageSnapshotListener({
        docs: [
          createDoc("user-1", {
            count: 0,
            totalReceived: 1,
            totalPickedUp: 1,
            holdForResubscribe: false,
          }),
        ],
      });
    });

    await waitFor(() => {
      expect(
        screen.getByText(
          "No customers currently have packages checked in at this partner location.",
        ),
      ).toBeInTheDocument();
    });
  });
});
