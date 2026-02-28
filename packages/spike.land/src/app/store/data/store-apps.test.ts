import { describe, expect, it } from "vitest";

import {
  getAppBySlug,
  getAppsByCategory,
  getAppsByPricing,
  getFeaturedApps,
  getMostInstalledApps,
  getNewApps,
  getStoreStats,
  getTopRatedApps,
  STORE_APPS,
  STORE_CATEGORIES,
} from "./store-apps";

describe("STORE_APPS data integrity", () => {
  it("should have at least 15 apps", () => {
    expect(STORE_APPS.length).toBeGreaterThanOrEqual(15);
  });

  it("should have unique IDs", () => {
    const ids = STORE_APPS.map(app => app.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("should have unique slugs", () => {
    const slugs = STORE_APPS.map(app => app.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("each app should have all required fields", () => {
    for (const app of STORE_APPS) {
      expect(app.id).toBeTruthy();
      expect(typeof app.id).toBe("string");
      expect(app.slug).toBeTruthy();
      expect(typeof app.slug).toBe("string");
      expect(app.name).toBeTruthy();
      expect(typeof app.name).toBe("string");
      expect(app.tagline).toBeTruthy();
      expect(typeof app.tagline).toBe("string");
      expect(app.description).toBeTruthy();
      expect(typeof app.description).toBe("string");
      expect(app.longDescription).toBeTruthy();
      expect(typeof app.longDescription).toBe("string");
    }
  });

  it("each app should have valid cardVariant", () => {
    const validVariants = [
      "blue",
      "fuchsia",
      "green",
      "purple",
      "orange",
      "pink",
    ];
    for (const app of STORE_APPS) {
      expect(validVariants).toContain(app.cardVariant);
    }
  });

  it("each app should have valid category", () => {
    const validCategories = [
      "creative",
      "productivity",
      "developer",
      "communication",
      "lifestyle",
      "ai-agents",
    ];
    for (const app of STORE_APPS) {
      expect(validCategories).toContain(app.category);
    }
  });

  it("each app should have non-empty mcpTools array", () => {
    for (const app of STORE_APPS) {
      expect(app.mcpTools.length).toBeGreaterThan(0);
    }
  });

  it("each app should have non-empty features array", () => {
    for (const app of STORE_APPS) {
      expect(app.features.length).toBeGreaterThan(0);
    }
  });

  it("each app should have toolCount matching mcpTools length", () => {
    for (const app of STORE_APPS) {
      expect(app.toolCount).toBe(app.mcpTools.length);
    }
  });

  it("each app should have non-empty tags array", () => {
    for (const app of STORE_APPS) {
      expect(app.tags.length).toBeGreaterThan(0);
    }
  });

  it("each app should have a color string", () => {
    for (const app of STORE_APPS) {
      expect(app.color).toBeTruthy();
      expect(typeof app.color).toBe("string");
    }
  });

  it("each app should have boolean isFeatured and isFirstParty", () => {
    for (const app of STORE_APPS) {
      expect(typeof app.isFeatured).toBe("boolean");
      expect(typeof app.isFirstParty).toBe("boolean");
    }
  });

  it("each MCP tool should have name, category, and description", () => {
    for (const app of STORE_APPS) {
      for (const tool of app.mcpTools) {
        expect(tool.name).toBeTruthy();
        expect(typeof tool.name).toBe("string");
        expect(tool.category).toBeTruthy();
        expect(typeof tool.category).toBe("string");
        expect(tool.description).toBeTruthy();
        expect(typeof tool.description).toBe("string");
      }
    }
  });
});

describe("optional new fields", () => {
  it("rating should be between 0 and 5 when present", () => {
    for (const app of STORE_APPS) {
      if (app.rating !== undefined) {
        expect(app.rating).toBeGreaterThanOrEqual(0);
        expect(app.rating).toBeLessThanOrEqual(5);
      }
    }
  });

  it("installCount should be non-negative when present", () => {
    for (const app of STORE_APPS) {
      if (app.installCount !== undefined) {
        expect(app.installCount).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("pricing should be a valid value when present", () => {
    const validPricing = ["free", "freemium", "paid"];
    for (const app of STORE_APPS) {
      if (app.pricing !== undefined) {
        expect(validPricing).toContain(app.pricing);
      }
    }
  });

  it("isNew apps should have a publishedAt date", () => {
    for (const app of STORE_APPS) {
      if (app.isNew) {
        expect(app.publishedAt).toBeDefined();
        expect(typeof app.publishedAt).toBe("string");
      }
    }
  });

  it("ratingCount should be non-negative when present", () => {
    for (const app of STORE_APPS) {
      if (app.ratingCount !== undefined) {
        expect(app.ratingCount).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe("STORE_CATEGORIES", () => {
  it("should include 'all' category", () => {
    const allCategory = STORE_CATEGORIES.find(c => c.id === "all");
    expect(allCategory).toBeDefined();
  });

  it("should have 7 categories including 'all'", () => {
    expect(STORE_CATEGORIES).toHaveLength(7);
  });

  it("each category should have an icon", () => {
    for (const cat of STORE_CATEGORIES) {
      expect(cat.icon).toBeTruthy();
      expect(typeof cat.icon).toBe("string");
    }
  });
});

describe("getAppBySlug", () => {
  it("should find existing app by slug", () => {
    expect(getAppBySlug("codespace")).toBeDefined();
  });

  it("should return undefined for non-existent slug", () => {
    expect(getAppBySlug("nonexistent")).toBeUndefined();
  });

  it("should return correct app", () => {
    const app = getAppBySlug("codespace");
    expect(app?.slug).toBe("codespace");
  });
});

describe("getAppsByCategory", () => {
  it("should return all apps for 'all' category", () => {
    expect(getAppsByCategory("all")).toHaveLength(STORE_APPS.length);
  });

  it("should filter by category", () => {
    const productivityApps = getAppsByCategory("productivity");
    for (const app of productivityApps) {
      expect(app.category).toBe("productivity");
    }
  });

  it("should return empty array for non-existent category", () => {
    expect(getAppsByCategory("nonexistent")).toHaveLength(0);
  });
});

describe("getFeaturedApps", () => {
  it("should return only featured apps", () => {
    const featured = getFeaturedApps();
    for (const app of featured) {
      expect(app.isFeatured).toBe(true);
    }
  });

  it("should return at least one featured app", () => {
    expect(getFeaturedApps().length).toBeGreaterThan(0);
  });
});

describe("getStoreStats", () => {
  it("should return correct app count", () => {
    const stats = getStoreStats();
    expect(stats.appCount).toBe(STORE_APPS.length);
  });

  it("should return correct total tool count", () => {
    const stats = getStoreStats();
    const expectedToolCount = STORE_APPS.reduce(
      (sum, app) => sum + app.toolCount,
      0,
    );
    expect(stats.toolCount).toBe(expectedToolCount);
  });

  it("should return developerCount", () => {
    const stats = getStoreStats();
    expect(stats.developerCount).toBeGreaterThan(0);
  });

  it("should return categoryCount", () => {
    const stats = getStoreStats();
    expect(stats.categoryCount).toBeGreaterThan(0);
    expect(stats.categoryCount).toBeLessThanOrEqual(STORE_CATEGORIES.length);
  });
});

describe("getNewApps", () => {
  it("should return only apps with isNew === true", () => {
    const newApps = getNewApps();
    for (const app of newApps) {
      expect(app.isNew).toBe(true);
    }
  });

  it("should return array of new apps (may be empty)", () => {
    expect(getNewApps().length).toBeGreaterThanOrEqual(0);
  });
});

describe("getAppsByPricing", () => {
  it("should return free apps", () => {
    const free = getAppsByPricing("free");
    expect(free.length).toBeGreaterThan(0);
    for (const app of free) {
      expect(app.pricing ?? "free").toBe("free");
    }
  });

  it("should return freemium apps (may be empty after cleanup)", () => {
    const freemium = getAppsByPricing("freemium");
    expect(Array.isArray(freemium)).toBe(true);
    for (const app of freemium) {
      expect(app.pricing).toBe("freemium");
    }
  });
});

describe("getTopRatedApps", () => {
  it("should return apps sorted by rating descending", () => {
    const top = getTopRatedApps(5);
    for (let i = 1; i < top.length; i++) {
      const prev = top[i - 1];
      const curr = top[i];
      expect(prev?.rating ?? 0).toBeGreaterThanOrEqual(curr?.rating ?? 0);
    }
  });

  it("should respect the limit parameter", () => {
    const top = getTopRatedApps(3);
    expect(top.length).toBeLessThanOrEqual(3);
  });

  it("should only include apps with ratings", () => {
    const top = getTopRatedApps();
    for (const app of top) {
      expect(app.rating).toBeDefined();
    }
  });
});

describe("getMostInstalledApps", () => {
  it("should return apps sorted by installCount descending", () => {
    const top = getMostInstalledApps(5);
    for (let i = 1; i < top.length; i++) {
      const prev = top[i - 1];
      const curr = top[i];
      expect(prev?.installCount ?? 0).toBeGreaterThanOrEqual(
        curr?.installCount ?? 0,
      );
    }
  });

  it("should only include apps with installCount", () => {
    const top = getMostInstalledApps();
    for (const app of top) {
      expect(app.installCount).toBeDefined();
    }
  });
});
