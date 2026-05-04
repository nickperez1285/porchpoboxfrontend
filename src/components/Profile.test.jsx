import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { within } from "@testing-library/dom";
import { MemoryRouter } from "react-router-dom";
import Profile from "./Profile";
import {
  collection,
  collectionGroup,
  doc,
  documentId,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where
} from "firebase/firestore";

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
  collectionGroup: jest.fn(),
  doc: jest.fn(),
  documentId: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  onSnapshot: jest.fn(),
  query: jest.fn(),
  where: jest.fn()
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
    collectionGroup.mockImplementation((...segments) =>
      segments.map((segment) => (typeof segment === "string" ? segment : "mock-db")).join("/")
    );
    doc.mockImplementation((...segments) =>
      segments.map((segment) => (typeof segment === "string" ? segment : "mock-db")).join("/")
    );
    documentId.mockReturnValue("document-id");
    where.mockImplementation((...args) => ({ type: "where", args }));
    query.mockImplementation((target, ...clauses) => ({ target, clauses }));
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
      });

    onSnapshot.mockImplementation((target, onNext) => {
      onNext({
        docs: [
          {
            id: "user-1",
            data: () => ({
              count: 0,
              totalReceived: 1,
              totalPickedUp: 1
            }),
            ref: {
              parent: {
                parent: {
                  path: "partners/partner-1"
                }
              }
            }
          }
        ]
      });

      return jest.fn();
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
      expect(collectionGroup).toHaveBeenCalledWith(expect.anything(), "packageCounts");
      expect(where).toHaveBeenCalledWith("document-id", "==", "user-1");
      expect(onSnapshot).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.stringContaining("packageCounts")
        }),
        expect.any(Function),
        expect.any(Function)
      );
    });
  });
});
