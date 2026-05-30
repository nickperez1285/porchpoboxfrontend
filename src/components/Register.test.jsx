import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import Register from "./Register";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { isPasswordValid } from "../utils/passwordValidation";
import { apiPost } from "../utils/apiClient";

// Mock Firebase
jest.mock("../firebase", () => ({
  auth: {},
  db: {},
}));

jest.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  updateProfile: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn((_db, _coll, id) => ({ id, _path: {} })),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(() => ({
    toDate: () => new Date("2026-05-28T10:00:00Z"),
  })), // Mock serverTimestamp to return a consistent object
  getDoc: jest.fn(() => Promise.resolve({ exists: () => false })), // Default: doc does not exist
  updateDoc: jest.fn(), // Mock updateDoc for existing user flow
}));

// Mock utils and config
jest.mock("../utils/passwordValidation", () => ({
  isPasswordValid: jest.fn(() => true),
  passwordRequirementsText: "Mock requirements",
}));

jest.mock("../utils/apiClient", () => ({
  apiPost: jest.fn(),
}));

// Mock useNavigate specifically to check for 'replace' flag
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("../config/api", () => ({
  __esModule: true,
  default: "http://localhost:5000",
  getApiUrl: (path) =>
    `http://localhost:5000${path.startsWith("/") ? path : `/${path}`}`,
}));

const MOCK_DATE = new Date("2026-05-28T10:00:00Z");
const RealDate = Date;

describe("Register Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    doc.mockImplementation((_db, _coll, id) => ({ id, _path: {} }));
    serverTimestamp.mockReturnValue({
      toDate: () => new RealDate("2026-05-28T10:00:00Z"),
    });
    isPasswordValid.mockReturnValue(true);
    apiPost.mockResolvedValue({ ok: true });
    // Reset Date mock for each test
    global.Date = jest.fn(() => MOCK_DATE);
    global.Date.now = jest.fn(() => MOCK_DATE.getTime());
    global.Date.prototype.getDate = jest.fn(() => MOCK_DATE.getDate());
    global.Date.prototype.getMonth = jest.fn(() => MOCK_DATE.getMonth());
    global.Date.prototype.getFullYear = jest.fn(() => MOCK_DATE.getFullYear());
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      }),
    );
  });

  afterEach(() => {
    global.Date = RealDate; // Restore original Date object
  });

  it("renders registration form correctly", () => {
    render(
      <Router>
        <Register />
      </Router>,
    );
    expect(
      screen.getByRole("heading", { name: /Create account/i }),
    ).toBeInTheDocument();
  });

  it("shows validation error for invalid email", async () => {
    render(
      <Router>
        <Register />
      </Router>,
    );

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "invalid-email" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Create account/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Please enter a valid email address/i),
      ).toBeInTheDocument();
    });
  });

  it("successfully registers a user and generates referral code", async () => {
    createUserWithEmailAndPassword.mockResolvedValue({
      user: { uid: "test-uid" },
    });

    render(
      <Router>
        <Register />
      </Router>,
    );

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Full name/i), {
      target: { value: "Jane Doe" },
    });
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: "1234567890" },
    });
    fireEvent.change(screen.getByLabelText(/Street address/i), {
      target: { value: "123 Main St" },
    });
    fireEvent.change(screen.getByLabelText(/City/i), {
      target: { value: "New York" },
    });
    fireEvent.change(screen.getByLabelText(/State/i), {
      target: { value: "NY" },
    });
    fireEvent.change(screen.getByLabelText(/ZIP code/i), {
      target: { value: "10001" },
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: "SecurePass123!" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm password/i), {
      target: { value: "SecurePass123!" },
    });
    fireEvent.click(
      screen.getAllByLabelText(/I agree to the terms and conditions/i)[1],
    );

    fireEvent.click(screen.getByRole("button", { name: /Create account/i }));

    await waitFor(() => {
      expect(createUserWithEmailAndPassword).toHaveBeenCalled();
      expect(setDoc).toHaveBeenCalledWith(
        expect.objectContaining({
          _path: expect.any(Object), // Ensure doc() returns a valid ref
          id: "test-uid",
        }),
        expect.objectContaining({
          name: "Jane Doe",
          nameLower: "jane doe", // Verifying data consistency for search
          referralCode: expect.stringMatching(/^JA\d{6}$/), // Matches name-prefix format
        }),
      );
      expect(mockNavigate).toHaveBeenCalledWith("/profile", { replace: true });
    });
  });
});
