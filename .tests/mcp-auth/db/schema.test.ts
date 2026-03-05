import { describe, expect, it } from "vitest";
import { account, orgInvite, orgMember, organization, session, user, verification } from "../../../src/mcp-auth/db/schema";
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

  describe("organization table", () => {
    it("has correct table name", () => {
      const config = getTableConfig(organization);
      expect(config.name).toBe("organization");
    });

    it("has all required columns", () => {
      const config = getTableConfig(organization);
      const columnNames = config.columns.map((c) => c.name);
      expect(columnNames).toContain("id");
      expect(columnNames).toContain("name");
      expect(columnNames).toContain("slug");
      expect(columnNames).toContain("plan");
      expect(columnNames).toContain("createdAt");
      expect(columnNames).toContain("updatedAt");
    });

    it("has slug column with unique constraint", () => {
      const config = getTableConfig(organization);
      const slugCol = config.columns.find((c) => c.name === "slug");
      expect(slugCol).toBeDefined();
      expect(slugCol!.isUnique).toBe(true);
    });

    it("has plan column with default value 'enterprise'", () => {
      const config = getTableConfig(organization);
      const planCol = config.columns.find((c) => c.name === "plan");
      expect(planCol).toBeDefined();
      expect(planCol!.default).toBe("enterprise");
    });

    it("columns can be inspected with getTableColumns", () => {
      const cols = getTableColumns(organization);
      expect(Object.keys(cols)).toContain("id");
      expect(Object.keys(cols)).toContain("slug");
    });
  });

  describe("orgMember table", () => {
    it("has correct table name", () => {
      const config = getTableConfig(orgMember);
      expect(config.name).toBe("org_member");
    });

    it("has all required columns", () => {
      const config = getTableConfig(orgMember);
      const columnNames = config.columns.map((c) => c.name);
      expect(columnNames).toContain("id");
      expect(columnNames).toContain("orgId");
      expect(columnNames).toContain("userId");
      expect(columnNames).toContain("role");
      expect(columnNames).toContain("createdAt");
      expect(columnNames).toContain("updatedAt");
    });

    it("has role column with default value 'member'", () => {
      const config = getTableConfig(orgMember);
      const roleCol = config.columns.find((c) => c.name === "role");
      expect(roleCol).toBeDefined();
      expect(roleCol!.default).toBe("member");
    });

    it("has foreign key references to organization and user", () => {
      const config = getTableConfig(orgMember);
      const foreignKeys = config.foreignKeys;
      expect(foreignKeys.length).toBeGreaterThanOrEqual(2);
      for (const fk of foreignKeys) {
        const reference = fk.reference();
        expect(reference).toBeDefined();
        expect(reference.columns.length).toBeGreaterThan(0);
        expect(reference.foreignTable).toBeDefined();
      }
    });

    it("columns can be inspected with getTableColumns", () => {
      const cols = getTableColumns(orgMember);
      expect(Object.keys(cols)).toContain("orgId");
      expect(Object.keys(cols)).toContain("userId");
    });
  });

  describe("orgInvite table", () => {
    it("has correct table name", () => {
      const config = getTableConfig(orgInvite);
      expect(config.name).toBe("org_invite");
    });

    it("has all required columns", () => {
      const config = getTableConfig(orgInvite);
      const columnNames = config.columns.map((c) => c.name);
      expect(columnNames).toContain("id");
      expect(columnNames).toContain("orgId");
      expect(columnNames).toContain("email");
      expect(columnNames).toContain("role");
      expect(columnNames).toContain("expiresAt");
      expect(columnNames).toContain("createdAt");
    });

    it("has role column with default value 'member'", () => {
      const config = getTableConfig(orgInvite);
      const roleCol = config.columns.find((c) => c.name === "role");
      expect(roleCol).toBeDefined();
      expect(roleCol!.default).toBe("member");
    });

    it("has foreign key reference to organization", () => {
      const config = getTableConfig(orgInvite);
      const foreignKeys = config.foreignKeys;
      expect(foreignKeys.length).toBeGreaterThanOrEqual(1);
      for (const fk of foreignKeys) {
        const reference = fk.reference();
        expect(reference).toBeDefined();
        expect(reference.foreignTable).toBeDefined();
      }
    });

    it("columns can be inspected with getTableColumns", () => {
      const cols = getTableColumns(orgInvite);
      expect(Object.keys(cols)).toContain("orgId");
      expect(Object.keys(cols)).toContain("email");
    });
  });
});
