import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import CustomerList from "./CustomerList";
import {
  collection,
  doc,
  increment,
  onSnapshot,
  setDoc,
  updateDoc
} from "firebase/firestore";

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
  increment: jest.fn((value) => ({ __increment: value })),
  onSnapshot: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn()
}));

const createDoc = (id, data) => ({
  id,
  data: () => data
});

describe("CustomerList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve("")
      })
    );

    increment.mockImplementation((value) => ({ __increment: value }));
    collection.mockImplementation((...segments) =>
      segments.map((segment) => (typeof segment === "string" ? segment : "mock-db")).join("/")
    );
    doc.mockImplementation((...segments) =>
      segments.map((segment) => (typeof segment === "string" ? segment : "mock-db")).join("/")
    );
  });

  it("preserves a zero-count package history document after the last package is delivered", async () => {
    const onPackagesDelivered = jest.fn();

    let packageSnapshotListener;

    onSnapshot.mockImplementation((target, onNext) => {
      if (String(target).includes("mock-db/users")) {
        onNext({
          docs: [
            createDoc("user-1", {
              name: "Casey Customer",
              email: "casey@example.com",
              status: "trial",
              packagesCheckedIn: 1,
              packagesDelivered: 0
            })
          ]
        });
      } else {
        packageSnapshotListener = onNext;
        onNext({
          docs: [
            createDoc("user-1", {
              count: 1,
              totalReceived: 1,
              totalPickedUp: 0
            })
          ]
        });
      }

      return jest.fn();
    });

    render(
      <CustomerList
        vendorId="partner-1"
        partnerLocationName="Main Street"
        onPackagesDelivered={onPackagesDelivered}
      />
    );

    expect(await screen.findByText("Casey Customer")).toBeInTheDocument();

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    const deliverBtn = await screen.findByRole("button", { name: /deliver selected \(1\)/i });
    fireEvent.click(deliverBtn);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/notifications/package-delivery",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
          body: JSON.stringify({
            partnerId: "partner-1",
            partnerName: "Main Street",
            recipients: [{ id: "user-1", name: "Casey Customer", email: "casey@example.com", packageCount: 1 }]
          })
        })
      );
    });

    packageSnapshotListener({
      docs: [
        createDoc("user-1", {
          count: 0,
          totalReceived: 1,
          totalPickedUp: 1,
          holdForResubscribe: false
        })
      ]
    });

    await waitFor(() => {
      expect(increment).toHaveBeenCalledWith(1);
      expect(updateDoc).toHaveBeenCalledWith(
        expect.stringContaining("partners/partner-1/packageCounts/user-1"),
        { totalPickedUp: { __increment: 1 } }
      );
      expect(setDoc).toHaveBeenCalledWith(
        expect.stringContaining("partners/partner-1/packageCounts/user-1"),
        {
          count: 0,
          holdForResubscribe: false
        },
        { merge: true }
      );
      expect(updateDoc).toHaveBeenCalledWith(
        expect.stringContaining("partners/partner-1"),
        { packageCheckInCount: { __increment: -1 } }
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText("No customers currently have packages checked in at this partner location.")
      ).toBeInTheDocument();
    });

    expect(onPackagesDelivered).toHaveBeenCalledWith(1);
  });
});
