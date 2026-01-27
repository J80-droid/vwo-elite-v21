/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// import React from 'react';
import { CodeLabLayout as CodeLab } from "../features/code/ui/CodeLabLayout";

// Mock pythonService
vi.mock("../services/pythonService", () => ({
  pythonService: {
    init: vi.fn().mockResolvedValue(undefined),
    run: vi
      .fn()
      .mockResolvedValue({ output: "Hello World", plots: [], variables: [] }),
    writeFile: vi.fn().mockResolvedValue("test.csv"),
  },
  PythonVariable: {},
}));

// Mock codeStore
vi.mock("../stores/codeStore", () => ({
  useCodeStore: () => ({
    projects: [
      {
        id: "test-project",
        name: "Test Project",
        files: [
          { name: "main.py", content: 'print("test")', language: "python" },
        ],
        lastModified: Date.now(),
      },
    ],
    activeProjectId: "test-project",
    activeFileName: "main.py",
    createProject: vi.fn(),
    setActiveProject: vi.fn(),
    setActiveFile: vi.fn(),
    updateFile: vi.fn(),
    addFile: vi.fn(),
    deleteFile: vi.fn(),
    deleteProject: vi.fn(),
  }),
}));

// Mock Monaco Editor
vi.mock("@monaco-editor/react", () => ({
  default: ({ value }: any) => <div data-testid="monaco-editor">{value}</div>,
}));

// Mock AI service
vi.mock("../services/aiCascadeService", () => ({
  cascadeGenerate: vi.fn().mockResolvedValue("This is an explanation."),
}));

// Mock MarkdownRenderer
vi.mock("../components/ui/MarkdownRenderer", () => ({
  MarkdownRenderer: ({ content }: any) => <div>{content}</div>,
}));

// Mock sqliteService
vi.mock("../services/sqliteService", () => ({
  logActivitySQL: vi.fn(),
}));

describe("CodeLab Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the 3-panel IDE layout", () => {
    render(<CodeLab />);

    // Check for main sections
    expect(screen.getByText("Bestanden")).toBeDefined();
    expect(screen.getByText("Test Project")).toBeDefined();
    expect(screen.getByText("main.py")).toBeDefined();
  });

  it("renders the run button", () => {
    render(<CodeLab />);
    expect(screen.getByText("Run")).toBeDefined();
  });

  it("renders AI code coach buttons", () => {
    render(<CodeLab />);
    expect(screen.getByText("Explain")).toBeDefined();
    expect(screen.getByText("Review")).toBeDefined();
  });

  it("renders the variable inspector panel", () => {
    render(<CodeLab />);
    expect(screen.getByText(/Variabelen/)).toBeDefined();
  });

  it("renders available packages info", () => {
    render(<CodeLab />);
    expect(screen.getByText("pandas")).toBeDefined();
    expect(screen.getByText("numpy")).toBeDefined();
  });
});
