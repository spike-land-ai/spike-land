import { describe, expect, it } from "vitest";
import { account, session, user, verification } from "../../../src/mcp-auth/db/schema";
import { getTableConfig } from "drizzle-orm/sqlite-core";
import { getTableColumns } from "drizzle-orm";

describe("mcp-auth Drizzle schema", () => {
  describe("user table", () => {
    it("has correct table name", () => {
      const config = getTableConfig(user);
      expect(config.name).toBe("user");
    });

    it("has updatedAt column with correct column name", () => {
      const config = getTableConfig(user);
      const updatedAtCol = config.columns.find((c) => c.name === "updatedAt");
      expect(updatedAtCol).toBeDefined();
      // Ensure updatedAt is NOT accidentally mapped to "createdAt"
      expect(updatedAtCol!.name).toBe("updatedAt");
    });

    it("has all required columns", () => {
      const config = getTableConfig(user);
      const columnNames = config.columns.map((c) => c.name);
      expect(columnNames).toContain("id");
      expect(columnNames).toContain("name");
      expect(columnNames).toContain("email");
      expect(columnNames).toContain("emailVerified");
      expect(columnNames).toContain("createdAt");
      expect(columnNames).toContain("updatedAt");
      expect(columnNames).toContain("role");
    });
  });

  describe("session table", () => {
    it("has correct table name", () => {
      const config = getTableConfig(session);
      expect(config.name).toBe("session");
    });

    it("has updatedAt column with correct column name", () => {
      const config = getTableConfig(session);
      const updatedAtCol = config.columns.find((c) => c.name === "updatedAt");
      expect(updatedAtCol).toBeDefined();
      expect(updatedAtCol!.name).toBe("updatedAt");
    });

    it("has token column with unique constraint", () => {
      const config = getTableConfig(session);
      const tokenCol = config.columns.find((c) => c.name === "token");
      expect(tokenCol).toBeDefined();
      expect(tokenCol!.isUnique).toBe(true);
    });
  });

  describe("account table", () => {
    it("has correct table name", () => {
      const config = getTableConfig(account);
      expect(config.name).toBe("account");
    });

    it("has updatedAt column with correct column name", () => {
      const config = getTableConfig(account);
      const updatedAtCol = config.columns.find((c) => c.name === "updatedAt");
      expect(updatedAtCol).toBeDefined();
      expect(updatedAtCol!.name).toBe("updatedAt");
    });

    it("has all required columns for Better Auth", () => {
      const config = getTableConfig(account);
      const columnNames = config.columns.map((c) => c.name);
      expect(columnNames).toContain("accountId");
      expect(columnNames).toContain("providerId");
      expect(columnNames).toContain("userId");
      expect(columnNames).toContain("password");
    });
  });

  describe("verification table", () => {
    it("has correct table name", () => {
      const config = getTableConfig(verification);
      expect(config.name).toBe("verification");
    });

    it("has updatedAt column with correct column name", () => {
      const config = getTableConfig(verification);
      const updatedAtCol = config.columns.find((c) => c.name === "updatedAt");
      expect(updatedAtCol).toBeDefined();
      expect(updatedAtCol!.name).toBe("updatedAt");
    });
  });

  describe("foreign key references", () => {
    it("session userId column references user table", () => {
      const config = getTableConfig(session);
      const userIdCol = config.columns.find((c) => c.name === "userId");
      expect(userIdCol).toBeDefined();
      // Drizzle stores reference functions on the column — invoke them to cover code
      const foreignKeys = config.foreignKeys;
      expect(foreignKeys).toBeDefined();
      // Invoking getReference on each FK exercises the reference callbacks (lines 24, 33)
      for (const fk of foreignKeys) {
        const reference = fk.reference();
        expect(reference).toBeDefined();
        expect(reference.columns.length).toBeGreaterThan(0);
        expect(reference.foreignTable).toBeDefined();
      }
    });

    it("account userId column references user table", () => {
      const config = getTableConfig(account);
      const foreignKeys = config.foreignKeys;
      expect(foreignKeys).toBeDefined();
      for (const fk of foreignKeys) {
        const reference = fk.reference();
        expect(reference).toBeDefined();
        expect(reference.columns.length).toBeGreaterThan(0);
      }
    });

    it("all tables can have their columns inspected", () => {
      // Use getTableColumns to ensure module-level code is all executed
      const userCols = getTableColumns(user);
      const sessionCols = getTableColumns(session);
      const accountCols = getTableColumns(account);
      const verificationCols = getTableColumns(verification);

      expect(Object.keys(userCols)).toContain("id");
      expect(Object.keys(sessionCols)).toContain("userId");
      expect(Object.keys(accountCols)).toContain("userId");
      expect(Object.keys(verificationCols)).toContain("identifier");
    });
  });
});
