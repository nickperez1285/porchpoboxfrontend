import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MainPage from "./MainPage";
import { getDocs, getDoc } from "firebase/firestore";

jest.mock("../firebase", () => ({ db: "mock-db" }));
jest.mock("firebase/firestore", () => ({
  collection: jest.fn(() => "mock-db/partners"),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  doc: jest.fn(() => "mock-db/doc"),
  query: jest.fn(() => "mock-query"),
  where: jest.fn(() => "mock-where"),
}));
jest.mock("./OneTimeProduct", () => () => <div>OneTimeProduct</div>);
jest.mock("react-leaflet", () => ({
  MapContainer: ({ children }) => <div data-testid="map">{children}</div>,
  TileLayer: () => <div>TileLayer</div>,
  Marker: ({ children }) => <div>Marker{children}</div>,
  Popup: ({ children }) => <div>{children}</div>,
}));

const vendor = {
  id: "v1",
  businessName: "Main Street Shop",
  streetAddress: "123 Main St",
  city: "Portland",
  state: "OR",
  zipCode: "97201",
  storeHours: "9-5 M-F",
};

const vendor2 = {
  id: "v2",
  businessName: "Second Location",
  streetAddress: "456 Oak Ave",
  city: "Beaverton",
  state: "OR",
  zipCode: "97005",
  storeHours: "10-6 M-Sat",
};

const renderMainPage = (overrides = {}) => {
  return render(
    <MemoryRouter>
      <MainPage
        user={overrides.user ?? null}
        userStatus={overrides.userStatus ?? ""}
      />
    </MemoryRouter>,
  );
};

describe("MainPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      }),
    );

    getDocs.mockResolvedValue({
      docs: [vendor, vendor2].map((v) => ({ id: v.id, data: () => v })),
    });
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ count: 0 }),
    });
  });

  it("renders hero section with title and message", async () => {
    renderMainPage();
    expect(
      await screen.findByText(
        "Secure Package Receiving Through Local Partner Locations",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Get your packages delivered and securely stored at a trusted local neighborhood Porch P.O. Box.",
      ),
    ).toBeInTheDocument();
  });

  it("renders hero action links", async () => {
    renderMainPage();
    expect(await screen.findByText("View plans")).toBeInTheDocument();
    expect(screen.getByText("How it works")).toBeInTheDocument();
    expect(screen.getByText("Contact")).toBeInTheDocument();
  });

  it("renders vendor list after loading", async () => {
    renderMainPage();
    expect(await screen.findByText("Main Street Shop")).toBeInTheDocument();
    expect(screen.getByText("Second Location")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    getDocs.mockImplementation(() => new Promise(() => {}));
    renderMainPage();
    expect(screen.getByText("Loading partners…")).toBeInTheDocument();
  });

  it("shows error state when fetch fails", async () => {
    getDocs.mockRejectedValue(new Error("Network error"));
    renderMainPage();
    expect(await screen.findByText("Network error")).toBeInTheDocument();
  });

  it("shows empty state when no vendors", async () => {
    getDocs.mockResolvedValue({ docs: [] });
    renderMainPage();
    expect(
      await screen.findByText(/No active partner locations/i),
    ).toBeInTheDocument();
  });

  it("shows no match message when search yields no results", async () => {
    renderMainPage();
    await screen.findByText("Main Street Shop");

    const searchInput = screen.getByPlaceholderText("Filter by city or zip...");
    fireEvent.change(searchInput, { target: { value: "zzznonexistent" } });

    expect(
      screen.getByText("No locations match your search."),
    ).toBeInTheDocument();
  });

  it("filters vendors by city", async () => {
    renderMainPage();
    await screen.findByText("Main Street Shop");

    const searchInput = screen.getByPlaceholderText("Filter by city or zip...");
    fireEvent.change(searchInput, { target: { value: "beaverton" } });

    expect(screen.queryByText("Main Street Shop")).not.toBeInTheDocument();
    expect(screen.getByText("Second Location")).toBeInTheDocument();
  });

  it("filters vendors by zip", async () => {
    renderMainPage();
    await screen.findByText("Main Street Shop");

    const searchInput = screen.getByPlaceholderText("Filter by city or zip...");
    fireEvent.change(searchInput, { target: { value: "97201" } });

    expect(screen.getByText("Main Street Shop")).toBeInTheDocument();
    expect(screen.queryByText("Second Location")).not.toBeInTheDocument();
  });

  it("expands vendor details on toggle", async () => {
    renderMainPage();
    await screen.findByText("Main Street Shop");

    fireEvent.click(screen.getByText("Main Street Shop"));

    expect(screen.getByText("Store hours: 9-5 M-F")).toBeInTheDocument();
    expect(
      screen.getByText("123 Main St, Portland, OR, 97201"),
    ).toBeInTheDocument();
  });

  it("shows Trial card label for trial user", async () => {
    renderMainPage({ user: { uid: "u1" }, userStatus: "trial" });
    expect(await screen.findByText("Trial")).toBeInTheDocument();
    expect(
      screen.getByText(/in trial status/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Member access"),
    ).not.toBeInTheDocument();
  });

  it("shows Member access card label for active user", async () => {
    renderMainPage({ user: { uid: "u1" }, userStatus: "active" });
    expect(await screen.findByText("Member access")).toBeInTheDocument();
    expect(
      screen.getByText(/Your subscription is active/),
    ).toBeInTheDocument();
  });

  it("shows Subscription plans / Sign up for non-logged-in user", async () => {
    renderMainPage();
    expect(await screen.findByText("Subscription plans")).toBeInTheDocument();
    expect(screen.getByText("Sign up")).toBeInTheDocument();
    expect(screen.getByText("OneTimeProduct")).toBeInTheDocument();
  });

  it("shows package waiting count as a link when count > 0", async () => {
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ count: 3 }),
    });

    renderMainPage({ user: { uid: "u1" }, userStatus: "active" });

    const link = await screen.findByRole("link", {
      name: /packages waiting/i,
    });
    expect(link).toHaveAttribute("href", "/profile");
  });

  it("shows single package waiting text with correct plural", async () => {
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ count: 1 }),
    });

    renderMainPage({ user: { uid: "u1" }, userStatus: "active" });

    const link = await screen.findByRole("link", {
      name: /packages waiting/i,
    });
    expect(link).toHaveAttribute("href", "/profile");
  });

  it("shows No packages waiting when count is 0", async () => {
    renderMainPage({ user: { uid: "u1" }, userStatus: "active" });

    expect(
      await screen.findByText(/No packages waiting/i),
    ).toBeInTheDocument();
  });

  it("manage deliveries link points to /profile", async () => {
    renderMainPage({ user: { uid: "u1" }, userStatus: "active" });

    const manageLink = await screen.findByRole("link", {
      name: /manage your deliveries/i,
    });
    expect(manageLink).toHaveAttribute("href", "/profile");
  });

  it("renders promotion banner", async () => {
    renderMainPage();
    expect(
      await screen.findByText("Try Porch P.O. Box for free"),
    ).toBeInTheDocument();
  });

  it("renders referral banner", async () => {
    renderMainPage();
    expect(
      await screen.findByText("Submit a referral →"),
    ).toBeInTheDocument();
  });

  it("renders map when markers are available", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([{ lat: "45.5152", lon: "-122.6784" }]),
      }),
    );

    renderMainPage();
    expect(await screen.findByTestId("map")).toBeInTheDocument();
  });
});
