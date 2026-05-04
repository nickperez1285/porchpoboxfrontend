import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { within } from "@testing-library/dom";
import { MemoryRouter } from "react-router-dom";
import Profile from "./Profile";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";

const mockNavigate = jest.fn();

jest.mock("../firebase", () => ({
  auth: {},
  db: { __name: "mock-db" }
}));

jest.mock("firebase/auth", () => ({
  signOut: jest.fn()
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn()
}));

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

const createDoc = (id, data) => ({
  id,
  data: () => data
});

describe("Profile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    collection.mockImplementation((...segments) =>
      segments.map((segment) => (typeof segment === "string" ? segment : "mock-db")).join("/")
    );
    doc.mockImplementation((...segments) =>
      segments.map((segment) => (typeof segment === "string" ? segment : "mock-db")).join("/")
    );
  });

  it("shows package history when the preserved partner package doc has zero current count", async () => {
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        name: "Casey Customer",
        status: "trial",
        phoneNumber: "555-123-4567"
      })
    });

    getDocs
      .mockResolvedValueOnce({
        docs: [
          createDoc("partner-1", {
            businessName: "Main Street Partner"
          })
        ]
      })
      .mockResolvedValueOnce({
        docs: [
          createDoc("user-1", {
            count: 0,
            totalReceived: 1,
            totalPickedUp: 1
          })
        ]
      });

    render(
      <MemoryRouter>
        <Profile
          user={{
            uid: "user-1",
            email: "casey@example.com",
            displayName: "Casey Customer"
          }}
        />
      </MemoryRouter>
    );

    expect(await screen.findByText("Main Street Partner")).toBeInTheDocument();

    const totalReceived = screen.getByText("Total Received").parentElement;
    const pickedUp = screen.getByText("Picked Up").parentElement;
    const waiting = screen.getByText("Waiting").parentElement;

    expect(within(totalReceived).getByText("1")).toBeInTheDocument();
    expect(within(pickedUp).getByText("1")).toBeInTheDocument();
    expect(within(waiting).getByText("0")).toBeInTheDocument();

    await waitFor(() => {
      expect(getDocs).toHaveBeenCalledWith(expect.stringContaining("partners"));
      expect(getDocs).toHaveBeenCalledWith(
        expect.stringContaining("partners/partner-1/packageCounts")
      );
    });
  });
});
