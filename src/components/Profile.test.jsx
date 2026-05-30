import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import Profile from "./Profile";
import { auth } from "../firebase";
import { collection, doc, onSnapshot } from "firebase/firestore";

// Mock Firebase modules
jest.mock("../firebase", () => ({
  auth: {
    currentUser: {
      uid: "test-uid",
      displayName: "Test User",
      email: "test@example.com",
    },
  },
  db: { __name: "mock-db" },
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  onSnapshot: jest.fn(),
  getDoc: jest.fn(),
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
    mockOnSnapshot = onSnapshot;
    onSnapshot.mockClear();
    doc.mockClear();
    collection.mockClear();

    // Mock onSnapshot and its unsubscribe function
    mockUnsubscribe = jest.fn();
    onSnapshot.mockImplementation((_ref, callback) => {
      // Default behavior: call the callback with an empty snapshot
      if (_ref === "user-doc") {
        callback({ exists: () => true, data: () => ({}) });
      } else {
        callback({ docs: [] });
      }
      return mockUnsubscribe;
    });

    doc.mockReturnValue("user-doc");
    collection.mockReturnValue("history-collection");

    // Spy on console.error to catch and potentially assert on errors
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore(); // Restore original console.error
  });

  const renderProfile = (user = auth.currentUser) => {
    return render(
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

    const { unmount } = renderProfile();

    expect(screen.getAllByText("Test User").length).toBeGreaterThan(0);
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    expect(screen.getAllByText(/Test Partner/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/123 Main St/i).length).toBeGreaterThan(0);
    expect(screen.getByText("TESTCODE")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument(); // Packages Delivered

    unmount();

    // Check if unsubscribe is called on unmount
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
        "CRITICAL: Permission denied reading packageHistory. Check /users/{userId}/packageHistory rule.",
        expect.any(Error),
      );
    });

    expect(screen.getByText("No package history yet.")).toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  });

  test("shows location selection prompt when prefLocation is not set", async () => {
    const mockUserData = {
      name: "Test User",
      email: "test@example.com",
      status: "active",
      prefLocation: null,
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

    expect(
      screen.getByText("Your Package Delivery Address"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Please select your preferred Porch P.O. Box location",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("You need to choose a partner location before subscribing."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Select Location" }),
    ).toBeInTheDocument();
  });

  test("partner name links to partner page in delivery address card", async () => {
    const mockUserData = {
      name: "Test User",
      email: "test@example.com",
      status: "active",
      prefLocation: {
        id: "partner123",
        businessName: "Test Partner",
        streetAddress: "123 Main St",
        city: "Anytown",
        state: "CA",
        zipCode: "12345",
      },
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

    const partnerLinks = screen.getAllByText("Test Partner");
    partnerLinks.forEach((link) => {
      expect(link.closest("a")).toHaveAttribute(
        "href",
        "/partner/partner123",
      );
    });
  });

  test("package history item links to partner page", async () => {
    const mockUserData = {
      name: "Test User",
      email: "test@example.com",
      status: "active",
      prefLocation: { id: "p1", businessName: "Shop" },
    };

    mockOnSnapshot.mockImplementationOnce((_ref, callback) => {
      callback({ exists: () => true, data: () => mockUserData });
      return mockUnsubscribe;
    });
    mockOnSnapshot.mockImplementationOnce((_ref, callback) => {
      callback({
        docs: [
          {
            id: "partner-abc",
            data: () => ({
              partnerId: "partner-abc",
              partnerName: "ABC Store",
              currentWaiting: 2,
              totalReceived: 5,
              totalPickedUp: 3,
            }),
          },
        ],
      });
      return mockUnsubscribe;
    });

    renderProfile();

    await waitFor(() => {
      const packageItem = screen.getByText(/ABC Store/);
      const link = packageItem.closest("a");
      expect(link).toHaveAttribute("href", "/partner/partner-abc");
    });
  });

  test("preferred location name links to partner page", async () => {
    const mockUserData = {
      name: "Test User",
      email: "test@example.com",
      status: "active",
      prefLocation: {
        id: "loc-456",
        businessName: "My Partner",
      },
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

    await waitFor(() => {
      const partnerLinks = screen.getAllByText("My Partner");
      // The link should have the correct href
      const linkEl = partnerLinks[0].closest("a");
      expect(linkEl).toHaveAttribute("href", "/partner/loc-456");
    });
  });
});
