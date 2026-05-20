import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import Register from "./Register";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc } from "firebase/firestore";

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
  doc: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(() => "mock-timestamp"),
  getDoc: jest.fn(),
}));

// Mock utils and config
jest.mock("../utils/passwordValidation", () => ({
  isPasswordValid: jest.fn(() => true),
  passwordRequirementsText: "Mock requirements",
}));

// Mock useNavigate specifically to check for 'replace' flag
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("../config/api", () => "http://localhost:5000");

describe("Register Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      }),
    );
  });

  it("renders registration form correctly", () => {
    render(
      <Router>
        <Register />
      </Router>,
    );
    expect(screen.getByText(/Create account/i)).toBeInTheDocument();
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
      screen.getByLabelText(/I agree to the terms and conditions/i),
    );

    fireEvent.click(screen.getByRole("button", { name: /Create account/i }));

    await waitFor(() => {
      expect(createUserWithEmailAndPassword).toHaveBeenCalled();
      expect(setDoc).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          name: "Jane Doe",
          nameLower: "jane doe", // Verifying data consistency for search
          referralCode: expect.stringMatching(/^JD\d{6}$/), // Matches Name-based prefix
        }),
      );
      expect(mockNavigate).toHaveBeenCalledWith("/profile", { replace: true });
    });
  });
});
