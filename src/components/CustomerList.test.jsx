import React from "react";
import { act, render, screen, waitFor, fireEvent } from "@testing-library/react";
import CustomerList from "./CustomerList";
import {
  collection,
  doc,
  onSnapshot,
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
