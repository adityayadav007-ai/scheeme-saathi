import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import "../i18n/index.js";
import EligibilityWizardPage from "./EligibilityWizardPage.jsx";
import { ANSWERS_SESSION_KEY } from "../utils/wizard.js";

function renderWizard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <MemoryRouter
          initialEntries={["/check"]}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <Routes>
            <Route path="/check" element={<EligibilityWizardPage />} />
            <Route path="/results" element={<p>Results view</p>} />
          </Routes>
        </MemoryRouter>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  cleanup();
});

describe("eligibility wizard", () => {
  test.each(["{invalid json", "{}", '{"age":{"unexpected":true}}'])(
    "clears corrupted saved answers and starts fresh (%s)",
    (storedAnswers) => {
      sessionStorage.setItem(ANSWERS_SESSION_KEY, storedAnswers);

      renderWizard();

      expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("1");
      expect(screen.getByLabelText(/How old are you/).value).toBe("");
      expect(sessionStorage.getItem(ANSWERS_SESSION_KEY)).toBeNull();
    }
  );

  test("validates the required age before continuing", async () => {
    const user = userEvent.setup();
    renderWizard();

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(
      screen.getByText("Please answer this question to continue.")
    ).toBeTruthy();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("1");
    expect(screen.queryByLabelText(/Which state or union territory/)).toBeNull();
  });

  test("advances and returns while retaining the entered answer", async () => {
    const user = userEvent.setup();
    renderWizard();

    await user.type(screen.getByLabelText(/How old are you/), "30");
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(
      screen.getByLabelText(/Which state or union territory/)
    ).toBeTruthy();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("2");
    expect(document.activeElement).toBe(
      screen.getByLabelText(/Which state or union territory/)
    );

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByLabelText(/How old are you/).value).toBe("30");
    expect(JSON.parse(sessionStorage.getItem(ANSWERS_SESSION_KEY)).age).toBe(30);
  });

  test("Start over clears saved answers and returns to the first step", async () => {
    const user = userEvent.setup();
    renderWizard();

    fireEvent.change(screen.getByLabelText(/How old are you/), {
      target: { value: "30" }
    });
    expect(sessionStorage.getItem(ANSWERS_SESSION_KEY)).not.toBeNull();

    await user.click(screen.getByRole("button", { name: "Start over" }));

    expect(sessionStorage.getItem(ANSWERS_SESSION_KEY)).toBeNull();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("1");
    expect(screen.getByLabelText(/How old are you/).value).toBe("");
  });
});
