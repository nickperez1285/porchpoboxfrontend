import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import PartnerInfoPage from "./PartnerInfoPage";
import { doc, getDoc } from "firebase/firestore";

jest.mock("../firebase", () => ({ db: "mock-db" }));
jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
}));

const mockPartner = {
  businessName: "Main Street Shop",
  streetAddress: "123 Main St",
  city: "Portland",
  state: "OR",
  zipCode: "97201",
  phoneNumber: "503-555-0123",
  email: "shop@example.com",
  storeHours: "Mon-Fri 9am-5pm",
  approved: true,
};

const setupMocks = () => {
  doc.mockImplementation((...segments) =>
    segments.map((s) => (typeof s === "string" ? s : "mock-db")).join("/"),
  );
};

const renderPartnerInfo = ({ partnerId = "p1", getDocResult } = {}) => {
  setupMocks();
  getDoc.mockResolvedValue(
    getDocResult || {
      id: partnerId,
      exists: () => true,
      data: () => mockPartner,
    },
  );

  return render(
    <MemoryRouter initialEntries={[`/partner/${partnerId}`]}>
      <Routes>
        <Route path="/partner/:partnerId" element={<PartnerInfoPage />} />
      </Routes>
    </MemoryRouter>,
  );
};

describe("PartnerInfoPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading state initially", () => {
    setupMocks();
    getDoc.mockImplementation(() => new Promise(() => {}));
    render(
      <MemoryRouter initialEntries={["/partner/p1"]}>
        <Routes>
          <Route path="/partner/:partnerId" element={<PartnerInfoPage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(
      screen.getByText("Loading partner information…"),
    ).toBeInTheDocument();
  });

  it("shows error when partner not found", async () => {
    renderPartnerInfo({
      getDocResult: { exists: () => false },
    });
    expect(
      await screen.findByText("Partner not found."),
    ).toBeInTheDocument();
  });

  it("shows generic error on fetch failure", async () => {
    setupMocks();
    getDoc.mockRejectedValue(new Error("Network error"));
    render(
      <MemoryRouter initialEntries={["/partner/p1"]}>
        <Routes>
          <Route path="/partner/:partnerId" element={<PartnerInfoPage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(
      await screen.findByText("Unable to load partner information."),
    ).toBeInTheDocument();
  });

  it("displays partner business name", async () => {
    renderPartnerInfo();
    expect(
      await screen.findByText("Main Street Shop"),
    ).toBeInTheDocument();
  });

  it("displays Active Location badge for approved partner", async () => {
    renderPartnerInfo();
    expect(
      await screen.findByText("Active Location"),
    ).toBeInTheDocument();
  });

  it("does not show Active Location badge when partner is not approved", async () => {
    renderPartnerInfo({
      getDocResult: {
        id: "p1",
        exists: () => true,
        data: () => ({ ...mockPartner, approved: false }),
      },
    });
    await waitFor(() => {
      expect(
        screen.queryByText("Active Location"),
      ).not.toBeInTheDocument();
    });
  });

  it("displays partner address", async () => {
    renderPartnerInfo();
    expect(
      await screen.findByText("123 Main St, Portland, OR, 97201"),
    ).toBeInTheDocument();
  });

  it("displays partner phone number as clickable link", async () => {
    renderPartnerInfo();
    expect(
      await screen.findByText("503-555-0123"),
    ).toBeInTheDocument();
    const phoneLink = screen.getByText("503-555-0123").closest("a");
    expect(phoneLink).toHaveAttribute("href", "tel:503-555-0123");
  });

  it("displays partner email as clickable link", async () => {
    renderPartnerInfo();
    expect(
      await screen.findByText("shop@example.com"),
    ).toBeInTheDocument();
    const emailLink = screen.getByText("shop@example.com").closest("a");
    expect(emailLink).toHaveAttribute("href", "mailto:shop@example.com");
  });

  it("displays store hours", async () => {
    renderPartnerInfo();
    expect(
      await screen.findByText("Mon-Fri 9am-5pm"),
    ).toBeInTheDocument();
  });

  it('shows "Not provided" when store hours are missing', async () => {
    renderPartnerInfo({
      getDocResult: {
        id: "p1",
        exists: () => true,
        data: () => ({
          ...mockPartner,
          storeHours: undefined,
        }),
      },
    });
    expect(
      await screen.findByText("Not provided"),
    ).toBeInTheDocument();
  });

  it("renders Back link", async () => {
    renderPartnerInfo();
    expect(
      await screen.findByText("← Back"),
    ).toBeInTheDocument();
  });

  it("renders Partner Location label", async () => {
    renderPartnerInfo();
    expect(
      await screen.findByText("Partner Location"),
    ).toBeInTheDocument();
  });

  it("renders Address section", async () => {
    renderPartnerInfo();
    expect(
      await screen.findByText("Address"),
    ).toBeInTheDocument();
  });

  it("renders Contact section", async () => {
    renderPartnerInfo();
    expect(
      await screen.findByText("Contact"),
    ).toBeInTheDocument();
  });

  it("renders Store Hours section", async () => {
    renderPartnerInfo();
    expect(
      await screen.findByText("Store Hours"),
    ).toBeInTheDocument();
  });
});
