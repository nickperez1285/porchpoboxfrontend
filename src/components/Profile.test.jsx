import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import Profile from "../Profile";
import { auth, db } from "../../firebase";
import { mockDeep } from "jest-mock-extended";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";

// Mock Firebase modules
jest.mock("../../firebase", () => ({
  auth: {
    currentUser: {
      uid: "test-uid",
      displayName: "Test User",
      email: "test@example.com",
    },
  },
  db: {}, // Will be mocked deeply later
}));

// Mock react-router-dom's useNavigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

describe("Profile Component", () => {
  let mockOnSnapshot;
  let mockUnsubscribe;
  let consoleErrorSpy;

  beforeEach(() => {
    // Reset mocks before each test
    mockNavigate.mockClear();

    // Mock onSnapshot and its unsubscribe function
    mockUnsubscribe = jest.fn();
    mockOnSnapshot = jest.fn((_ref, callback, errorCallback) => {
      // Default behavior: call the callback with an empty snapshot
      callback({
        exists: () => false,
        data: () => undefined,
        docs: [],
      });
      return mockUnsubscribe;
    });

    // Deeply mock the Firestore instance
    db.collection = jest.fn(() => ({
      doc: jest.fn(() => ({
        collection: jest.fn(() => ({
          onSnapshot: mockOnSnapshot,
        })),
      })),
      onSnapshot: mockOnSnapshot, // For the user profile document
    }));
    db.doc = jest.fn(() => ({
      onSnapshot: mockOnSnapshot,
    }));

    // Spy on console.error to catch and potentially assert on errors
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore(); // Restore original console.error
  });

  const renderProfile = (user = auth.currentUser) => {
    render(
      <Router>
        <Profile user={user} />
      </Router>,
    );
  };

  test("displays user profile information", async () => {
    const mockUserData = {
      name: "Test User",
      email: "test@example.com",
      status: "active",
      subscribedAt: new Date(),
      subscriptionEndsAt: new Date(Date.now() + 86400000 * 30), // 30 days from now
      prefLocation: {
        id: "partner123",
        businessName: "Test Partner",
        streetAddress: "123 Main St",
        city: "Anytown",
        state: "CA",
        zipCode: "12345",
      },
      referralCode: "TESTCODE",
      packagesDelivered: 5,
    };

    // Mock onSnapshot for the user profile document
    mockOnSnapshot.mockImplementationOnce((_ref, callback) => {
      callback({
        exists: () => true,
        data: () => mockUserData,
      });
      return mockUnsubscribe;
    });

    // Mock onSnapshot for package history (empty for this test)
    mockOnSnapshot.mockImplementationOnce((_ref, callback) => {
      callback({ docs: [] });
      return mockUnsubscribe;
    });

    renderProfile();

    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Test Partner")).toBeInTheDocument();
    expect(screen.getByText("123 Main St")).toBeInTheDocument();
    expect(screen.getByText("TESTCODE")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument(); // Packages Delivered

    // Check if unsubscribe is called on unmount (implicit in cleanup after test)
    expect(mockUnsubscribe).toHaveBeenCalledTimes(2); // One for profile, one for package history
  });

  test("handles Firebase permission error for package history gracefully", async () => {
    const mockUserData = {
      name: "Test User",
      email: "test@example.com",
      status: "active",
    };

    // Mock onSnapshot for the user profile document (success)
    mockOnSnapshot.mockImplementationOnce((_ref, callback) => {
      callback({
        exists: () => true,
        data: () => mockUserData,
      });
      return mockUnsubscribe;
    });

    // Mock onSnapshot for package history (error scenario)
    mockOnSnapshot.mockImplementationOnce((_ref, callback, errorCallback) => {
      const firebaseError = new Error("Missing or insufficient permissions.");
      firebaseError.code = "permission-denied"; // Simulate FirebaseError code
      errorCallback(firebaseError);
      return mockUnsubscribe;
    });

    renderProfile();

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error loading package history:",
        expect.any(Error),
      );
    });

    expect(screen.getByText("No package history yet.")).toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  });

  test("displays 'No delivery address yet' if prefLocation is not set", async () => {
    const mockUserData = {
      name: "Test User",
      email: "test@example.com",
      status: "active",
      prefLocation: null, // No preferred location
    };

    mockOnSnapshot.mockImplementationOnce((_ref, callback) => {
      callback({ exists: () => true, data: () => mockUserData });
      return mockUnsubscribe;
    });
    mockOnSnapshot.mockImplementationOnce((_ref, callback) => {
      callback({ docs: [] });
      return mockUnsubscribe;
    });

    renderProfile();

    expect(screen.getByText("No delivery address yet")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Set a preferred partner location to get your package delivery address.",
      ),
    ).toBeInTheDocument();
  });
});
