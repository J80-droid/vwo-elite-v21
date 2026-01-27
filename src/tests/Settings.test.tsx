import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// import React from 'react';
import { Settings } from "../features/settings/ui/SettingsLanding";

// Mock hook
const mockUpdateSettings = vi.fn();
const mockExportBackup = vi.fn();
const mockImportBackup = vi.fn();
const mockFactoryReset = vi.fn();

vi.mock("../hooks/useSettings", () => ({
  useSettings: () => ({
    settings: {
      profile: {
        name: "Test User",
        examYear: 2024,
        profile: "NT",
        targetGrades: { "Wiskunde B": 8 },
      },
      theme: "electric",
      aiConfig: { persona: "socratic" },
      pomodoroWork: 25,
      pomodoroBreak: 5,
      shortcuts: {},
    },
    updateSettings: mockUpdateSettings,
    exportBackup: mockExportBackup,
    importBackup: mockImportBackup,
    factoryReset: mockFactoryReset,
    themes: ["electric", "cyberpunk", "gold"],
  }),
}));

describe("Settings Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock navigator.storage
    Object.defineProperty(global.navigator, "storage", {
      value: {
        estimate: vi.fn().mockResolvedValue({ usage: 1000, quota: 5000 }),
        persist: vi.fn().mockResolvedValue(true),
      },
      writable: true,
    });
  });

  it("should render profile tab by default", () => {
    render(<Settings />);
    expect(screen.getByText("Persoonlijk Profiel")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test User")).toBeInTheDocument();
  });

  it("should update profile name", () => {
    render(<Settings />);
    const input = screen.getByDisplayValue("Test User");
    fireEvent.change(input, { target: { value: "New Name" } });
    expect(mockUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        profile: expect.objectContaining({ name: "New Name" }),
      }),
    );
  });

  it("should switch tabs", async () => {
    render(<Settings />);
    const appearanceTab = screen.getByText("Appearance");
    fireEvent.click(appearanceTab);

    await waitFor(() => {
      expect(screen.getByText("Look & Feel")).toBeInTheDocument();
    });
  });

  it("should change theme", async () => {
    render(<Settings />);
    fireEvent.click(screen.getByText("Appearance"));
    const goldThemeBtn = screen.getByText("gold");
    fireEvent.click(goldThemeBtn);
    expect(mockUpdateSettings).toHaveBeenCalledWith({ theme: "gold" });
  });

  it("should trigger factory reset", async () => {
    render(<Settings />);
    fireEvent.click(screen.getByText("Data Management")); // Sidebar button text includes icon so regex or partial text helpful
    await waitFor(() => {
      expect(
        screen.getByText("Factory Reset", { exact: false }),
      ).toBeInTheDocument();
    });

    const resetBtn = screen.getByText("Reset App");
    fireEvent.click(resetBtn);
    expect(mockFactoryReset).toHaveBeenCalled();
  });
});
