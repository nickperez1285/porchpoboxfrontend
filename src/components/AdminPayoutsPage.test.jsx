import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminPayoutsPage from "./AdminPayoutsPage";
import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, updateDoc } from "firebase/firestore";

jest.mock("../firebase", () => ({ db: "mock-db" }));
jest.mock("firebase/firestore", () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  onSnapshot: jest.fn(),
  orderBy: jest.fn(() => "orderBy"),
  query: jest.fn((col) => col),
  serverTimestamp: jest.fn(() => "ts"),
  updateDoc: jest.fn(),
  where: jest.fn(() => "where")
}));

const CURRENT_MONTH = new Date().toLocaleString("default", { month: "long", year: "numeric" });
const mockPayout    = { id: "pay1", month: "April 2025", amount: 25, subscriberCount: 5, status: "pending" };
const mockPaidPayout = { id: "pay2", month: "March 2025", amount: 20, subscriberCount: 4, status: "paid", paidAt: { toDate: () => new Date("2025-03-30") } };

const setupMocks = (payouts = [mockPayout]) => {
  collection.mockImplementation((...args) => args.filter((a) => typeof a === "string").join("/"));
  doc.mockImplementation((...args) => args.filter((a) => typeof a === "string").join("/"));

  getDocs
    .mockResolvedValueOnce({ docs: [{ id: "p1", data: () => ({ businessName: "Shop A", approved: true, city: "Springfield", state: "CA" }) }] })
    .mockResolvedValueOnce({ size: 5 });

  onSnapshot.mockImplementation((q, cb) => {
    cb({ docs: payouts.map((p) => ({ id: p.id, data: () => p })) });
    return jest.fn();
  });
};

const renderPage = () => render(<MemoryRouter><AdminPayoutsPage /></MemoryRouter>);

describe("AdminPayoutsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
    addDoc.mockResolvedValue({ id: "new-payout" });
    updateDoc.mockResolvedValue();
    deleteDoc.mockResolvedValue();
  });

  it("renders partner name and payout history", async () => {
    setupMocks([mockPayout]);
    renderPage();
    expect(await screen.findByText("Shop A")).toBeInTheDocument();
    expect(await screen.findByText("April 2025")).toBeInTheDocument();
  });

  it("shows correct total owed and total paid in summary stats", async () => {
    setupMocks([mockPayout, mockPaidPayout]);
    renderPage();
    await screen.findByText("Shop A");
    // pending payout = $25 owed, paid payout = $20 paid
    expect(screen.getAllByText("$25").length).toBeGreaterThan(0);
    expect(screen.getAllByText("$20").length).toBeGreaterThan(0);
  });

  it("creates a payout when Create button is clicked", async () => {
    setupMocks([]);
    renderPage();
    await screen.findByText("Shop A");

    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledWith(
        expect.stringContaining("partners/p1/payouts"),
        expect.objectContaining({ status: "pending", subscriberCount: 5 })
      );
    });
  });

  it("marks a payout as paid when Mark Paid is clicked", async () => {
    setupMocks([mockPayout]);
    renderPage();
    await screen.findByText("April 2025");

    fireEvent.click(screen.getByText("Mark Paid"));

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(
        expect.stringContaining("partners/p1/payouts/pay1"),
        expect.objectContaining({ status: "paid" })
      );
    });
  });

  it("deletes a payout when Delete is clicked and confirmed", async () => {
    setupMocks([mockPayout]);
    renderPage();
    await screen.findByText("April 2025");

    fireEvent.click(screen.getAllByText("Delete")[0]);

    await waitFor(() => {
      expect(deleteDoc).toHaveBeenCalledWith(
        expect.stringContaining("partners/p1/payouts/pay1")
      );
    });
  });

  it("does not delete when confirm is cancelled", async () => {
    window.confirm = jest.fn(() => false);
    setupMocks([mockPayout]);
    renderPage();
    await screen.findByText("April 2025");

    fireEvent.click(screen.getAllByText("Delete")[0]);

    await waitFor(() => expect(deleteDoc).not.toHaveBeenCalled());
  });

  it("shows already-created message when partner has a payout this month", async () => {
    const thisMonthPayout = { id: "pay3", month: CURRENT_MONTH, amount: 25, subscriberCount: 5, status: "pending" };
    setupMocks([thisMonthPayout]);
    renderPage();
    expect(await screen.findByText(`✓ Payout created for ${CURRENT_MONTH}`)).toBeInTheDocument();
  });

  it("bulk create skips partners that already have a payout this month", async () => {
    const thisMonthPayout = { id: "pay3", month: CURRENT_MONTH, amount: 25, subscriberCount: 5, status: "pending" };
    setupMocks([thisMonthPayout]);
    renderPage();
    await screen.findByText("Shop A");

    fireEvent.click(screen.getByText(/Create All Payouts/));

    await waitFor(() => expect(addDoc).not.toHaveBeenCalled());
  });
});
