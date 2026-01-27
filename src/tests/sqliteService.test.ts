/* eslint-disable @typescript-eslint/no-explicit-any -- global vwoApi mocks */
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as sqliteService from "../shared/api/sqliteService";

vi.unmock("../shared/api/sqliteService");

describe("SQLite Service (IPC Bridge)", () => {
  const mockInvoke = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (window as any).vwoApi = {
      invoke: mockInvoke,
    };
  });

  it("should initialize database proxy", async () => {
    const db = await sqliteService.initDatabase();
    expect(db).toBeDefined();
    expect(db.run).toBeDefined();
    expect(db.exec).toBeDefined();
  });

  it("should insert data via IPC", async () => {
    await sqliteService.sqliteInsert("test_table", { name: "test" });
    expect(mockInvoke).toHaveBeenCalledWith("db:query", {
      sql: expect.stringContaining("INSERT OR REPLACE INTO test_table"),
      params: ["test"],
      method: "run",
    });
  });

  it("should select data and return object array", async () => {
    const mockRows = [{ id: "1", name: "Test" }];
    mockInvoke.mockResolvedValue(mockRows);

    const result = await sqliteService.sqliteSelect("test_table");
    expect(result).toEqual(mockRows);
    expect(mockInvoke).toHaveBeenCalledWith("db:query", {
      sql: expect.stringContaining("SELECT * FROM test_table"),
      params: undefined,
      method: "all",
    });
  });

  it("should handle updates via IPC", async () => {
    await sqliteService.sqliteUpdate("test_table", { name: "new" }, "id = ?", ["1"]);
    expect(mockInvoke).toHaveBeenCalledWith("db:query", {
      sql: expect.stringContaining("UPDATE test_table SET name = ? WHERE id = ?"),
      params: ["new", "1"],
      method: "run",
    });
  });
});
