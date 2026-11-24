import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider, useTranslation } from "react-i18next";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi
} from "vitest";
import i18n from "../i18n/index.js";
import LanguageToggle from "./LanguageToggle.jsx";

function NavigationText() {
  const { t } = useTranslation();
  return <p>{t("nav.home")}</p>;
}

beforeEach(async () => {
  await i18n.changeLanguage("en");
  const values = new Map();
  vi.stubGlobal("localStorage", {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear()
  });
  localStorage.clear();
  document.documentElement.lang = "en";
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("language toggle", () => {
  test("switches the UI to Hindi, updates document language and direction, and persists the choice", async () => {
    const user = userEvent.setup();
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageToggle />
        <NavigationText />
      </I18nextProvider>
    );

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Choose language" }),
      "hi"
    );

    await waitFor(() => {
      expect(screen.getByText("होम")).toBeTruthy();
      expect(document.documentElement.lang).toBe("hi");
      expect(document.documentElement.dir).toBe("ltr");
      expect(localStorage.getItem("scheme-saathi-language")).toBe("hi");
    });
  });

  test("sets right-to-left direction when Urdu is selected", async () => {
    const user = userEvent.setup();
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageToggle />
      </I18nextProvider>
    );

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Choose language" }),
      "ur"
    );

    await waitFor(() => {
      expect(document.documentElement.lang).toBe("ur");
      expect(document.documentElement.dir).toBe("rtl");
    });
  });
});
