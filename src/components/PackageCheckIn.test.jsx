import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PackageCheckIn from "./PackageCheckIn";
import { auth } from "../firebase";

jest.mock("../firebase", () => ({
  db: "mock-db",
  auth: {
    currentUser: {
      uid: "p1",
      getIdToken: jest.fn().mockResolvedValue("mock-token"),
    },
  },
}));
jest.mock("./PartnerStatusLegend", () => () => <div>PartnerStatusLegend</div>);
jest.mock("../config/api", () => ({
  getApiUrl: jest.fn((path) => `http://localhost:5000${path}`),
}));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

const partnerProfile = {
  id: "partner-1",
  businessName: "Main Street Shop",
  streetAddress: "123 Main St",
};

const mockSearchResults = [
  {
    id: "u1",
    name: "Alice Johnson",
    email: "alice@test.com",
    phoneNumber: "555-0101",
    streetAddress: "100 Oak St",
    city: "Portland",
    status: "active",
    packageCount: 1,
    totalReceived: 3,
    totalPickedUp: 2,
  },
  {
    id: "u2",
    name: "Bob Smith",
    email: "bob@test.com",
    phoneNumber: "555-0202",
    status: "trial",
    packageCount: 0,
    totalReceived: 1,
    totalPickedUp: 1,
  },
  {
    id: "u3",
    name: "Charlie Brown",
    email: "charlie@test.com",
    status: "inactive",
    packageCount: 0,
    totalReceived: 0,
    totalPickedUp: 0,
  },
];

const renderCheckIn = (overrides = {}) => {
  return render(
    <MemoryRouter>
      <PackageCheckIn
        user={overrides.user ?? auth.currentUser}
        partnerProfile={overrides.partnerProfile ?? partnerProfile}
        onPackagesCheckedIn={overrides.onPackagesCheckedIn ?? jest.fn()}
      />
    </MemoryRouter>,
  );
};

describe("PackageCheckIn", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders the check-in page header", () => {
    renderCheckIn();
    expect(screen.getByText("Package check-in")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Select customers, set how many packages arrived, then confirm/,
      ),
    ).toBeInTheDocument();
  });

  it("renders the partner location label", () => {
    renderCheckIn();
    expect(screen.getByText(/Main Street Shop/)).toBeInTheDocument();
  });

  it("renders Back to portal link", () => {
    renderCheckIn();
    expect(screen.getByText("← Back to portal")).toBeInTheDocument();
  });

  it("renders PartnerStatusLegend", () => {
    renderCheckIn();
    expect(screen.getByText("PartnerStatusLegend")).toBeInTheDocument();
  });

  it("renders search input", () => {
    renderCheckIn();
    expect(
      screen.getByPlaceholderText("Search by name or email…"),
    ).toBeInTheDocument();
  });

  it("shows initial empty state message", () => {
    renderCheckIn();
    expect(
      screen.getByText("Type a name or email to search customers"),
    ).toBeInTheDocument();
  });

  it("shows loading customers state while searching", async () => {
    global.fetch.mockImplementation(() => new Promise(() => {}));
    renderCheckIn();

    const searchInput = screen.getByPlaceholderText("Search by name or email…");
    fireEvent.change(searchInput, { target: { value: "alice" } });

    jest.advanceTimersByTime(300);

    expect(await screen.findByText("Loading customers…")).toBeInTheDocument();
  });

  it("searches and displays customer results", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSearchResults),
    });

    renderCheckIn();

    const searchInput = screen.getByPlaceholderText("Search by name or email…");
    fireEvent.change(searchInput, { target: { value: "alice" } });

    jest.advanceTimersByTime(300);
    await screen.findByText("Alice Johnson");

    expect(screen.getByText("Bob Smith")).toBeInTheDocument();
  });

  it("shows search result count", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSearchResults),
    });

    renderCheckIn();

    const searchInput = screen.getByPlaceholderText("Search by name or email…");
    fireEvent.change(searchInput, { target: { value: "alice" } });

    jest.advanceTimersByTime(300);
    await screen.findByText(/Search Results \(3\)/);
  });

  it("shows no customers match message when search yields empty", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    renderCheckIn();

    const searchInput = screen.getByPlaceholderText("Search by name or email…");
    fireEvent.change(searchInput, { target: { value: "zzz" } });

    jest.advanceTimersByTime(300);
    expect(
      await screen.findByText("No customers match your search."),
    ).toBeInTheDocument();
  });

  it("shows error when search fails", async () => {
    global.fetch.mockRejectedValue(new Error("Search failed"));

    renderCheckIn();

    const searchInput = screen.getByPlaceholderText("Search by name or email…");
    fireEvent.change(searchInput, { target: { value: "alice" } });

    jest.advanceTimersByTime(300);
    expect(
      await screen.findByText("Search failed"),
    ).toBeInTheDocument();
  });

  it("shows 0 packages selected badge initially", () => {
    renderCheckIn();
    expect(screen.getByText("0 packages selected")).toBeInTheDocument();
  });

  it("selects a user and shows updated package count", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSearchResults),
    });

    renderCheckIn();

    const searchInput = screen.getByPlaceholderText("Search by name or email…");
    fireEvent.change(searchInput, { target: { value: "alice" } });

    jest.advanceTimersByTime(300);
    await screen.findByText("Alice Johnson");

    const checkbox = screen.getByLabelText("Include Alice Johnson in check-in");
    fireEvent.click(checkbox);

    expect(screen.getByText("1 package selected")).toBeInTheDocument();
  });

  it("selects multiple users and shows correct total count", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSearchResults),
    });

    renderCheckIn();

    const searchInput = screen.getByPlaceholderText("Search by name or email…");
    fireEvent.change(searchInput, { target: { value: "alice" } });

    jest.advanceTimersByTime(300);
    await screen.findByText("Alice Johnson");

    fireEvent.click(screen.getByLabelText("Include Alice Johnson in check-in"));
    fireEvent.click(screen.getByLabelText("Include Bob Smith in check-in"));

    expect(screen.getByText("2 packages selected")).toBeInTheDocument();
  });

  it("shows quantity input for selected user", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSearchResults),
    });

    renderCheckIn();

    const searchInput = screen.getByPlaceholderText("Search by name or email…");
    fireEvent.change(searchInput, { target: { value: "alice" } });

    jest.advanceTimersByTime(300);
    await screen.findByText("Alice Johnson");

    fireEvent.click(screen.getByLabelText("Include Alice Johnson in check-in"));

    const qtyInput = screen.getByLabelText("Package count for Alice Johnson");
    expect(qtyInput).toHaveValue(1);
  });

  it("updates package count when quantity changes", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSearchResults),
    });

    renderCheckIn();

    const searchInput = screen.getByPlaceholderText("Search by name or email…");
    fireEvent.change(searchInput, { target: { value: "alice" } });

    jest.advanceTimersByTime(300);
    await screen.findByText("Alice Johnson");

    fireEvent.click(screen.getByLabelText("Include Alice Johnson in check-in"));

    const qtyInput = screen.getByLabelText("Package count for Alice Johnson");
    fireEvent.change(qtyInput, { target: { value: "3" } });
    fireEvent.blur(qtyInput);

    expect(screen.getByText("3 packages selected")).toBeInTheDocument();
  });

  it("shows selected users section", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSearchResults),
    });

    renderCheckIn();

    const searchInput = screen.getByPlaceholderText("Search by name or email…");
    fireEvent.change(searchInput, { target: { value: "alice" } });

    jest.advanceTimersByTime(300);
    await screen.findByText("Alice Johnson");

    fireEvent.click(screen.getByLabelText("Include Alice Johnson in check-in"));

    expect(
      screen.getByText(/Selected for Check-In \(1\)/),
    ).toBeInTheDocument();
  });

  it("shows Check in packages button disabled when nothing selected", () => {
    renderCheckIn();
    expect(screen.getByText("Check in packages")).toBeDisabled();
  });

  it("enables Check in packages button when user selected", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSearchResults),
    });

    renderCheckIn();

    const searchInput = screen.getByPlaceholderText("Search by name or email…");
    fireEvent.change(searchInput, { target: { value: "alice" } });

    jest.advanceTimersByTime(300);
    await screen.findByText("Alice Johnson");

    fireEvent.click(screen.getByLabelText("Include Alice Johnson in check-in"));

    expect(screen.getByText("Check in packages")).not.toBeDisabled();
  });

  it("shows confirmation modal when Check in packages clicked", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSearchResults),
    });

    renderCheckIn();

    const searchInput = screen.getByPlaceholderText("Search by name or email…");
    fireEvent.change(searchInput, { target: { value: "alice" } });

    jest.advanceTimersByTime(300);
    await screen.findByText("Alice Johnson");

    fireEvent.click(screen.getByLabelText("Include Alice Johnson in check-in"));
    fireEvent.click(screen.getByText("Check in packages"));

    expect(
      screen.getByRole("heading", { name: "Confirm check-in" }),
    ).toBeInTheDocument();
    const confirmBtn = screen.getByRole("button", { name: "Confirm check-in" });
    expect(confirmBtn).toBeInTheDocument();
  });

  it("shows warning for inactive users in confirmation", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSearchResults),
    });

    renderCheckIn();

    const searchInput = screen.getByPlaceholderText("Search by name or email…");
    fireEvent.change(searchInput, { target: { value: "charlie" } });

    jest.advanceTimersByTime(300);
    await screen.findByText("Charlie Brown");

    fireEvent.click(
      screen.getByLabelText("Include Charlie Brown in check-in"),
    );

    fireEvent.click(screen.getByText("Check in packages"));

    expect(screen.getByText("Payment may be required")).toBeInTheDocument();
  });

  it("does not show inactive warning when all users are active", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([mockSearchResults[0]]),
    });

    renderCheckIn();

    const searchInput = screen.getByPlaceholderText("Search by name or email…");
    fireEvent.change(searchInput, { target: { value: "alice" } });

    jest.advanceTimersByTime(300);
    await screen.findByText("Alice Johnson");

    fireEvent.click(screen.getByLabelText("Include Alice Johnson in check-in"));
    fireEvent.click(screen.getByText("Check in packages"));

    expect(
      screen.queryByText("Payment may be required"),
    ).not.toBeInTheDocument();
  });

  it("submits check-in and navigates back to partner portal", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSearchResults),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(""),
      });

    const onPackagesCheckedIn = jest.fn().mockResolvedValue();
    renderCheckIn({ onPackagesCheckedIn });

    const searchInput = screen.getByPlaceholderText("Search by name or email…");
    fireEvent.change(searchInput, { target: { value: "alice" } });

    jest.advanceTimersByTime(300);
    await screen.findByText("Alice Johnson");

    fireEvent.click(screen.getByLabelText("Include Alice Johnson in check-in"));
    fireEvent.click(screen.getByText("Check in packages"));

    fireEvent.click(screen.getByRole("button", { name: "Confirm check-in" }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/partner");
    });
    expect(onPackagesCheckedIn).toHaveBeenCalled();
  });

  it("shows error when check-in submission fails", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSearchResults),
      })
      .mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve("Check-in failed"),
      });

    renderCheckIn();

    const searchInput = screen.getByPlaceholderText("Search by name or email…");
    fireEvent.change(searchInput, { target: { value: "alice" } });

    jest.advanceTimersByTime(300);
    await screen.findByText("Alice Johnson");

    fireEvent.click(screen.getByLabelText("Include Alice Johnson in check-in"));
    fireEvent.click(screen.getByText("Check in packages"));

    fireEvent.click(screen.getByRole("button", { name: "Confirm check-in" }));

    expect(
      await screen.findByText("Check-in failed"),
    ).toBeInTheDocument();
  });

  it("closes confirmation modal with Go back button", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSearchResults),
    });

    renderCheckIn();

    const searchInput = screen.getByPlaceholderText("Search by name or email…");
    fireEvent.change(searchInput, { target: { value: "alice" } });

    jest.advanceTimersByTime(300);
    await screen.findByText("Alice Johnson");

    fireEvent.click(screen.getByLabelText("Include Alice Johnson in check-in"));
    fireEvent.click(screen.getByText("Check in packages"));

    expect(
      screen.getByRole("heading", { name: "Confirm check-in" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText("Go back"));

    expect(
      screen.queryByRole("heading", { name: "Confirm check-in" }),
    ).not.toBeInTheDocument();
  });

  it("shows Checking in… during submission", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSearchResults),
      })
      .mockImplementationOnce(() => new Promise(() => {}));

    renderCheckIn();

    const searchInput = screen.getByPlaceholderText("Search by name or email…");
    fireEvent.change(searchInput, { target: { value: "alice" } });

    jest.advanceTimersByTime(300);
    await screen.findByText("Alice Johnson");

    fireEvent.click(screen.getByLabelText("Include Alice Johnson in check-in"));
    fireEvent.click(screen.getByText("Check in packages"));

    fireEvent.click(screen.getByRole("button", { name: "Confirm check-in" }));

    expect(await screen.findByText("Checking in…")).toBeInTheDocument();
  });

  it("expands user details on Details click", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSearchResults),
    });

    renderCheckIn();

    const searchInput = screen.getByPlaceholderText("Search by name or email…");
    fireEvent.change(searchInput, { target: { value: "alice" } });

    jest.advanceTimersByTime(300);
    await screen.findByText("Alice Johnson");

    const detailBtns = screen.getAllByText("Details");
    fireEvent.click(detailBtns[0]);

    expect(screen.getByText(/Email: alice@test.com/)).toBeInTheDocument();
    expect(screen.getByText(/Phone: 555-0101/)).toBeInTheDocument();
    expect(screen.getByText(/Subscription status: active/)).toBeInTheDocument();
  });

  it("hides user details on Hide details click", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSearchResults),
    });

    renderCheckIn();

    const searchInput = screen.getByPlaceholderText("Search by name or email…");
    fireEvent.change(searchInput, { target: { value: "alice" } });

    jest.advanceTimersByTime(300);
    await screen.findByText("Alice Johnson");

    const detailBtns = screen.getAllByText("Details");
    fireEvent.click(detailBtns[0]);
    expect(screen.getByText("Hide details")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Hide details"));
    expect(screen.queryByText("Hide details")).not.toBeInTheDocument();
  });

  it("shows Cancel button that navigates back", () => {
    renderCheckIn();
    fireEvent.click(screen.getByText("Cancel"));
    expect(mockNavigate).toHaveBeenCalledWith("/partner");
  });

  it("removes selected user when ✕ is clicked", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSearchResults),
    });

    renderCheckIn();

    const searchInput = screen.getByPlaceholderText("Search by name or email…");
    fireEvent.change(searchInput, { target: { value: "alice" } });

    jest.advanceTimersByTime(300);
    await screen.findByText("Alice Johnson");

    fireEvent.click(screen.getByLabelText("Include Alice Johnson in check-in"));
    expect(screen.getByText("1 package selected")).toBeInTheDocument();

    fireEvent.click(screen.getByText("✕"));

    expect(screen.getByText("0 packages selected")).toBeInTheDocument();
  });
});
