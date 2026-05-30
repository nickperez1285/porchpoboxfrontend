import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PrefLocationModal from "./PrefLocationModal";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  updateDoc,
} from "firebase/firestore";

jest.mock("../firebase", () => ({ db: "mock-db" }));
jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  doc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  updateDoc: jest.fn(),
}));

const partner1 = {
  id: "p1",
  businessName: "Main Street Shop",
  streetAddress: "123 Main St",
  city: "Portland",
  state: "OR",
  storeHours: "9-5 M-F",
};

const partner2 = {
  id: "p2",
  businessName: "Oak Ave Post",
  streetAddress: "456 Oak Ave",
  city: "Beaverton",
  state: "OR",
};

const mockPartners = [partner1, partner2];

const defaultUser = { uid: "u1", email: "test@test.com" };

const renderModal = (overrides = {}) => {
  collection.mockImplementation((...segments) =>
    segments.map((s) => (typeof s === "string" ? s : "mock-db")).join("/"),
  );
  doc.mockImplementation((...segments) =>
    segments.map((s) => (typeof s === "string" ? s : "mock-db")).join("/"),
  );
  query.mockImplementation((...args) => args);
  where.mockImplementation(() => "where-clause");
  getDocs.mockResolvedValue({
    docs: mockPartners.map((p) => ({ id: p.id, data: () => p })),
  });
  updateDoc.mockResolvedValue();

  return render(
    <PrefLocationModal
      user={overrides.user ?? defaultUser}
      onDone={overrides.onDone ?? jest.fn()}
      required={overrides.required ?? false}
    />,
  );
};

describe("PrefLocationModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the modal with title and description", async () => {
    renderModal();
    expect(
      await screen.findByText("Choose Your Preferred Location"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Select the partner location where/),
    ).toBeInTheDocument();
  });

  it("shows required description when required prop is true", async () => {
    renderModal({ required: true });
    expect(
      await screen.findByText(/Please select a partner location before subscribing/),
    ).toBeInTheDocument();
  });

  it("shows skip button when not required", async () => {
    renderModal({ required: false });
    expect(
      await screen.findByText("Skip for now"),
    ).toBeInTheDocument();
  });

  it("does not show skip button when required", () => {
    renderModal({ required: true });
    expect(
      screen.queryByText("Skip for now"),
    ).not.toBeInTheDocument();
  });

  it("renders partner list", async () => {
    renderModal();
    expect(
      await screen.findByText("Main Street Shop"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Oak Ave Post"),
    ).toBeInTheDocument();
  });

  it("shows partner addresses in list", async () => {
    renderModal();
    expect(
      await screen.findByText("123 Main St, Portland, OR"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("456 Oak Ave, Beaverton, OR"),
    ).toBeInTheDocument();
  });

  it("shows store hours for partner that has them", async () => {
    renderModal();
    expect(
      await screen.findByText("9-5 M-F"),
    ).toBeInTheDocument();
  });

  it("shows loading state when partners not yet loaded", () => {
    getDocs.mockImplementation(() => new Promise(() => {}));
    renderModal();
    expect(screen.getByText("Loading locations...")).toBeInTheDocument();
  });

  it("disables Save button when no partner selected", async () => {
    renderModal();
    const saveBtn = await screen.findByText("Save");
    expect(saveBtn).toBeDisabled();
  });

  it("enables Save button after selecting a partner", async () => {
    renderModal();
    await screen.findByText("Main Street Shop");

    fireEvent.click(screen.getByText("Main Street Shop"));
    const saveBtn = screen.getByText("Save");
    expect(saveBtn).not.toBeDisabled();
  });

  it("saves preferred location with prefLocationLastChangedAt on save", async () => {
    const onDone = jest.fn();
    renderModal({ onDone });
    await screen.findByText("Main Street Shop");

    fireEvent.click(screen.getByText("Main Street Shop"));
    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(
        "mock-db/users/u1",
        expect.objectContaining({
          prefLocation: expect.objectContaining({
            id: "p1",
            businessName: "Main Street Shop",
          }),
          prefLocationLastChangedAt: expect.any(Date),
        }),
      );
    });

    expect(onDone).toHaveBeenCalled();
  });

  it("calls onDone when Skip is clicked", async () => {
    const onDone = jest.fn();
    renderModal({ onDone, required: false });
    fireEvent.click(await screen.findByText("Skip for now"));
    expect(onDone).toHaveBeenCalled();
  });

  it("does not call updateDoc when nothing selected and Save is disabled", async () => {
    renderModal();
    await screen.findByText("Save");
    expect(updateDoc).not.toHaveBeenCalled();
  });

  it("shows Saving... while saving", async () => {
    updateDoc.mockImplementation(() => new Promise(() => {}));
    renderModal();
    await screen.findByText("Main Street Shop");

    fireEvent.click(screen.getByText("Main Street Shop"));
    fireEvent.click(screen.getByText("Save"));

    expect(await screen.findByText("Saving...")).toBeInTheDocument();
  });
});
