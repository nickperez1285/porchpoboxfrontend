import { render, screen } from "@testing-library/react";
import { MemoryRouter as Router } from "react-router-dom";
import Register from "./components/Register";

// Mock the Link component from react-router-dom if it's used directly
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

// Mock Firebase auth and firestore if they are imported directly
jest.mock("./firebase", () => ({
  auth: {}, // Mock auth object
  db: {}, // Mock db object
}));

// Mock Firebase Auth specifically to avoid "ID token" errors
jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(),
}));

// Mock apiPost if it's used
jest.mock("./utils/apiClient", () => ({
  apiPost: jest.fn(),
}));

describe("Register component", () => {
  test("renders the registration form", () => {
    render(
      <Router>
        <Register />
      </Router>,
    );

    expect(
      screen.getByRole("heading", { name: /create account/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/street address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/state/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/zip code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", {
        name: /i agree to the terms and conditions\./i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create account/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign up with google/i }),
    ).toBeInTheDocument();
  });
});
