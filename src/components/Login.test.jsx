import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import Login from "./Login";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getDoc } from "firebase/firestore";

// Mock Firebase
jest.mock("../firebase", () => ({
  auth: {},
  db: {},
}));

jest.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  onAuthStateChanged: jest.fn(() => jest.fn()),
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

describe("Login Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects partners to /partner after successful login", async () => {
    signInWithEmailAndPassword.mockResolvedValue({
      user: { uid: "partner-123", email: "partner@example.com" },
    });
    // Mock getDoc to return exists: true for the partners collection check
    getDoc.mockResolvedValue({
      exists: () => true,
    });

    render(
      <Router>
        <Login />
      </Router>,
    );

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: "partner@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/partner");
    });
  });

  it("redirects standard users to /profile after successful login", async () => {
    signInWithEmailAndPassword.mockResolvedValue({
      user: { uid: "user-123", email: "user@example.com" },
    });
    // Mock getDoc to return exists: false for the partners collection check
    getDoc.mockResolvedValue({
      exists: () => false,
    });

    render(
      <Router>
        <Login />
      </Router>,
    );

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/profile");
    });
  });
});
