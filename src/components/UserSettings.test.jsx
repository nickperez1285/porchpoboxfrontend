import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import UserSettings from "./UserSettings";
import { doc, getDoc, updateDoc } from "firebase/firestore";

jest.mock("../firebase", () => ({ auth: {}, db: "mock-db" }));
jest.mock("firebase/auth", () => ({ updateEmail: jest.fn(), updateProfile: jest.fn() }));
jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn()
}));
jest.mock("./PrefLocationModal", () => () => null);
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn()
}));

const mockUser = { uid: "u1", email: "alice@test.com", displayName: "Alice" };

const renderSettings = (profileData = {}) => {
  doc.mockReturnValue("users/u1");
  getDoc.mockResolvedValue({ exists: () => true, data: () => profileData });
  updateDoc.mockResolvedValue();
  return render(
    <MemoryRouter>
      <UserSettings user={mockUser} />
    </MemoryRouter>
  );
};

describe("UserSettings — Notifications", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows subscription settings on the settings page", async () => {
    renderSettings({
      status: "active",
      subscribedAt: new Date("2026-01-01T00:00:00Z"),
      subscriptionEndsAt: new Date("2026-12-31T00:00:00Z"),
    });

    expect(
      await screen.findByRole("heading", { name: "Subscription" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(
      screen.getAllByText(/Manage plan, renewal, and discounts/i).length,
    ).toBeGreaterThan(0);
  });

  it("shows notifications toggle in settings", async () => {
    renderSettings({ notificationsEnabled: true });
    expect(await screen.findByText(/Notifications/)).toBeInTheDocument();
    expect(screen.getByText("On")).toBeInTheDocument();
  });

  it("defaults to On when notificationsEnabled is not set in Firestore", async () => {
    renderSettings({});
    expect(await screen.findByText("On")).toBeInTheDocument();
  });

  it("shows Off when notificationsEnabled is false", async () => {
    renderSettings({ notificationsEnabled: false });
    expect(await screen.findByText("Off")).toBeInTheDocument();
  });

  it("toggles from On to Off and saves to Firestore", async () => {
    renderSettings({ notificationsEnabled: true });
    await screen.findByText("On");

    fireEvent.click(screen.getByLabelText("Toggle notifications"));

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith("users/u1", { notificationsEnabled: false });
    });
    expect(await screen.findByText("Off")).toBeInTheDocument();
  });

  it("toggles from Off to On and saves to Firestore", async () => {
    renderSettings({ notificationsEnabled: false });
    await screen.findByText("Off");

    fireEvent.click(screen.getByLabelText("Toggle notifications"));

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith("users/u1", { notificationsEnabled: true });
    });
    expect(await screen.findByText("On")).toBeInTheDocument();
  });
});
