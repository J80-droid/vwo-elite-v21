/* eslint-disable @typescript-eslint/no-explicit-any */
// Import coach translations for test assertions
import nlCoach from "@shared/assets/locales/nl/coach.json";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SocraticCoach } from "../pages/socraticcoach/ui/SocraticCoach";

// Mock the services
vi.mock("../services/gemini", () => ({
  chatWithSocraticCoach: vi.fn(),
  generatePodcastAudio: vi.fn(),
  generateEducationalImage: vi.fn(),
  generateChatSummary: vi.fn(),
}));

// Mock useTranslations hook
vi.mock("../hooks/useTranslations", () => ({
  useTranslations: () => ({
    t: (key: string) => {
      // Simple key lookup for tests
      const keys = key.split(".");
      let value: any = { coach: nlCoach };
      for (const k of keys) {
        value = value?.[k];
      }
      return value || key;
    },
    lang: "nl",
  }),
}));

// Mock useSettings hook
vi.mock("../hooks/useSettings", () => ({
  useSettings: () => ({
    settings: {
      aiConfig: {
        persona: "socratic",
      },
    },
  }),
}));

// Mock components that might be problematic in jsdom
vi.mock("../LiveCoach", () => ({
  LiveCoach: () => <div data-testid="live-coach">Live Coach Mock</div>,
}));

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(() => vi.fn()),
  useLocation: vi.fn(() => ({ pathname: "/coach" })),
}));

describe("SocraticCoach Component", () => {
  const t = nlCoach;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the initial state correctly", () => {
    render(<SocraticCoach />);

    expect(screen.getByText(t.intro)).toBeDefined();
    expect(screen.getByPlaceholderText(t.input)).toBeDefined();
  });

  it("updates input value on change", () => {
    render(<SocraticCoach />);
    const input = screen.getByPlaceholderText(t.input) as HTMLInputElement;

    fireEvent.change(input, { target: { value: "Hallo Coach" } });
    expect(input.value).toBe("Hallo Coach");
  });

  it("sends a message and displays coach response", async () => {
    const { chatWithSocraticCoach } = await import("@shared/api/gemini");
    (chatWithSocraticCoach as any).mockResolvedValue(
      "Dit is een Socratisch antwoord.",
    );

    render(<SocraticCoach />);
    const input = screen.getByPlaceholderText(t.input);

    fireEvent.change(input, { target: { value: "Waarom is de lucht blauw?" } });

    // Find send button by its name or common characteristic
    const buttons = screen.getAllByRole("button");
    const sendButton = buttons.find((b) => b.innerHTML.includes("svg")); // The send button has an arrow svg

    if (sendButton) {
      fireEvent.click(sendButton);
    } else {
      // Fallback if button finding logic fails
      const sendBtn = screen.getByRole("button", { name: /send/i });
      fireEvent.click(sendBtn);
    }

    // Wait for the coach response
    await waitFor(() => {
      expect(screen.getByText("Dit is een Socratisch antwoord.")).toBeDefined();
    });

    expect(chatWithSocraticCoach).toHaveBeenCalled();
  });

  it("changes coach role when clicked", () => {
    render(<SocraticCoach />);

    const strictButton = screen.getByText(t.roles.strict);
    fireEvent.click(strictButton);

    // Check if style changed (btn-glass-primary class added)
    expect(strictButton.className).toContain("btn-glass-primary");
  });
});
