import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ContactPage from "./components/Contact";

// Mock the global fetch function
global.fetch = jest.fn();

describe("ContactPage", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    fetch.mockClear();
  });

  test("renders the contact form", () => {
    render(<ContactPage />);
    expect(
      screen.getByRole("heading", { name: /contact us/i }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/your name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/your email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/your message/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /send message/i }),
    ).toBeInTheDocument();
  });

  test("shows success message on successful submission", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<ContactPage />);

    fireEvent.change(screen.getByPlaceholderText(/your name/i), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByPlaceholderText(/your email/i), {
      target: { value: "john.doe@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/your message/i), {
      target: { value: "Hello there!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /send message/i }));

    expect(screen.getByText(/sending.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText(/message sent successfully!/i),
      ).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5000/api/notifications/contact",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "John Doe",
          email: "john.doe@example.com",
          message: "Hello there!",
          subject: "Contact Form Submission",
        }),
      }),
    );
  });

  test("shows error message on failed submission", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Network error" }),
    });

    render(<ContactPage />);

    fireEvent.change(screen.getByPlaceholderText(/your name/i), {
      target: { value: "Jane Doe" },
    });
    fireEvent.change(screen.getByPlaceholderText(/your email/i), {
      target: { value: "jane.doe@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/your message/i), {
      target: { value: "I have a problem." },
    });

    fireEvent.click(screen.getByRole("button", { name: /send message/i }));

    expect(screen.getByText(/sending.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/error: network error/i)).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test("shows error message for missing fields", async () => {
    render(<ContactPage />);

    // Try submitting with missing name
    fireEvent.change(screen.getByPlaceholderText(/your email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/your message/i), {
      target: { value: "Test message." },
    });
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));

    // HTML5 form validation prevents submission, so we expect the form to not submit
    // and no fetch call to be made.
    expect(fetch).not.toHaveBeenCalled();
    // The status message should not appear immediately for client-side validation errors
    expect(screen.queryByText(/sending.../i)).not.toBeInTheDocument();
  });
});
