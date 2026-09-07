import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import App from "../src/App.jsx";

beforeEach(() => {
  vi.resetAllMocks();
});

describe("App smoke tests", () => {
  it("renders the app shell without crashing", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve([]),
        ok: true,
      })
    );

    render(<App />);

    expect(screen.getByText("From Spark to Spend.")).toBeDefined();
  });

  it("shows empty state when there are no concepts", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve([]),
        ok: true,
      })
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("No domains tracked yet.")).toBeDefined();
    });
  });

  it("renders navigation tabs", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve([]),
        ok: true,
      })
    );

    render(<App />);

    expect(screen.getByText("Dashboard")).toBeDefined();
    expect(screen.getByText("Concepts")).toBeDefined();
    expect(screen.getByText("Status Summary")).toBeDefined();
    expect(screen.getByText("Expenses")).toBeDefined();
  });
});
