/**
 * COMPASS Eligibility Engine — Profile Builder Tests
 *
 * Covers:
 *   - All setter methods
 *   - Fluent chaining
 *   - Validation errors for required fields
 *   - Input validation (type/range checks)
 *   - Idempotent disability/language add
 *   - Remove operations
 *   - ProfileBuilder.from() copy semantics
 *   - Immutability of built profile
 *   - build() can be called multiple times (builder is reusable)
 */

import { describe, expect, it } from "vitest";
import { ProfileBuilder } from "../core-logic/profile-builder.js";
import { CitizenshipStatus, EmploymentStatus } from "../types.js";

// ---------------------------------------------------------------------------
// Helper: minimal valid builder
// ---------------------------------------------------------------------------

function minimalBuilder(): ProfileBuilder {
  return new ProfileBuilder()
    .setAge(25)
    .setIncome(2_000_000)
    .setLocation({ countryCode: "US" })
    .setFamilySize(1)
    .setEmploymentStatus(EmploymentStatus.employed)
    .setCitizenshipStatus(CitizenshipStatus.citizen);
}

// ---------------------------------------------------------------------------
// Basic construction
// ---------------------------------------------------------------------------

describe("ProfileBuilder — basic construction", () => {
  it("builds a valid profile when all required fields are set", () => {
    const profile = minimalBuilder().build();
    expect(profile.age).toBe(25);
    expect(profile.incomeAnnualCents).toBe(2_000_000);
    expect(profile.location.countryCode).toBe("US");
    expect(profile.familySize).toBe(1);
    expect(profile.employmentStatus).toBe(EmploymentStatus.employed);
    expect(profile.citizenshipStatus).toBe(CitizenshipStatus.citizen);
    expect(profile.disabilities).toHaveLength(0);
    expect(profile.languages).toHaveLength(0);
    expect(profile.customFields.size).toBe(0);
  });

  it("supports fluent chaining — each setter returns the builder", () => {
    const builder = new ProfileBuilder();
    const result = builder.setAge(30);
    expect(result).toBe(builder); // same reference
  });
});

// ---------------------------------------------------------------------------
// Validation: required fields
// ---------------------------------------------------------------------------

describe("ProfileBuilder.build() — required fields", () => {
  it("throws when age is missing", () => {
    const builder = minimalBuilder();
    // Deliberately create a builder without age by resetting
    const fresh = new ProfileBuilder()
      .setIncome(0)
      .setLocation({ countryCode: "US" })
      .setFamilySize(1)
      .setEmploymentStatus(EmploymentStatus.employed)
      .setCitizenshipStatus(CitizenshipStatus.citizen);
    expect(() => fresh.build()).toThrowError(/age/);
  });

  it("throws when incomeAnnualCents is missing", () => {
    const fresh = new ProfileBuilder()
      .setAge(30)
      .setLocation({ countryCode: "US" })
      .setFamilySize(1)
      .setEmploymentStatus(EmploymentStatus.employed)
      .setCitizenshipStatus(CitizenshipStatus.citizen);
    expect(() => fresh.build()).toThrowError(/incomeAnnualCents/);
  });

  it("throws when location is missing", () => {
    const fresh = new ProfileBuilder()
      .setAge(30)
      .setIncome(0)
      .setFamilySize(1)
      .setEmploymentStatus(EmploymentStatus.employed)
      .setCitizenshipStatus(CitizenshipStatus.citizen);
    expect(() => fresh.build()).toThrowError(/location/);
  });

  it("throws when familySize is missing", () => {
    const fresh = new ProfileBuilder()
      .setAge(30)
      .setIncome(0)
      .setLocation({ countryCode: "US" })
      .setEmploymentStatus(EmploymentStatus.employed)
      .setCitizenshipStatus(CitizenshipStatus.citizen);
    expect(() => fresh.build()).toThrowError(/familySize/);
  });

  it("throws when employmentStatus is missing", () => {
    const fresh = new ProfileBuilder()
      .setAge(30)
      .setIncome(0)
      .setLocation({ countryCode: "US" })
      .setFamilySize(1)
      .setCitizenshipStatus(CitizenshipStatus.citizen);
    expect(() => fresh.build()).toThrowError(/employmentStatus/);
  });

  it("throws when citizenshipStatus is missing", () => {
    const fresh = new ProfileBuilder()
      .setAge(30)
      .setIncome(0)
      .setLocation({ countryCode: "US" })
      .setFamilySize(1)
      .setEmploymentStatus(EmploymentStatus.employed);
    expect(() => fresh.build()).toThrowError(/citizenshipStatus/);
  });

  it("error message lists ALL missing fields at once", () => {
    const fresh = new ProfileBuilder();
    let message = "";
    try {
      fresh.build();
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).toContain("age");
    expect(message).toContain("location");
    expect(message).toContain("familySize");
  });
});

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

describe("ProfileBuilder — input validation", () => {
  it("setAge throws for negative values", () => {
    expect(() => new ProfileBuilder().setAge(-1)).toThrow(RangeError);
  });

  it("setAge throws for non-integer values", () => {
    expect(() => new ProfileBuilder().setAge(25.5)).toThrow(RangeError);
  });

  it("setAge accepts zero (newborn)", () => {
    expect(() => new ProfileBuilder().setAge(0)).not.toThrow();
  });

  it("setIncome throws for negative values", () => {
    expect(() => new ProfileBuilder().setIncome(-100)).toThrow(RangeError);
  });

  it("setIncome throws for non-integer values", () => {
    expect(() => new ProfileBuilder().setIncome(1000.5)).toThrow(RangeError);
  });

  it("setIncome accepts zero (no income)", () => {
    expect(() => new ProfileBuilder().setIncome(0)).not.toThrow();
  });

  it("setLocation throws for invalid countryCode (lowercase)", () => {
    expect(() => new ProfileBuilder().setLocation({ countryCode: "us" })).toThrow(TypeError);
  });

  it("setLocation throws for invalid countryCode (3 chars)", () => {
    expect(() => new ProfileBuilder().setLocation({ countryCode: "USA" })).toThrow(TypeError);
  });

  it("setLocation accepts valid countryCode with optional region", () => {
    expect(() =>
      new ProfileBuilder().setLocation({ countryCode: "GB", regionCode: "ENG" }),
    ).not.toThrow();
  });

  it("setFamilySize throws for zero", () => {
    expect(() => new ProfileBuilder().setFamilySize(0)).toThrow(RangeError);
  });

  it("setFamilySize throws for negative values", () => {
    expect(() => new ProfileBuilder().setFamilySize(-2)).toThrow(RangeError);
  });

  it("setFamilySize throws for non-integer", () => {
    expect(() => new ProfileBuilder().setFamilySize(1.5)).toThrow(RangeError);
  });

  it("setFamilySize accepts 1 (single person)", () => {
    expect(() => new ProfileBuilder().setFamilySize(1)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Disabilities
// ---------------------------------------------------------------------------

describe("ProfileBuilder — disabilities", () => {
  it("addDisability appends a disability to the profile", () => {
    const profile = minimalBuilder()
      .addDisability({ code: "F32", description: "Depression", certified: true })
      .build();
    expect(profile.disabilities).toHaveLength(1);
    expect(profile.disabilities[0]?.code).toBe("F32");
  });

  it("addDisability with duplicate code is idempotent", () => {
    const profile = minimalBuilder()
      .addDisability({ code: "F32", description: "Depression", certified: true })
      .addDisability({ code: "F32", description: "Depression v2", certified: false })
      .build();
    // Only the first entry should remain
    expect(profile.disabilities).toHaveLength(1);
    expect(profile.disabilities[0]?.description).toBe("Depression");
  });

  it("removeDisability removes by code", () => {
    const profile = minimalBuilder()
      .addDisability({ code: "F32", description: "Depression", certified: true })
      .addDisability({ code: "M54.5", description: "Back pain", certified: false })
      .removeDisability("F32")
      .build();
    expect(profile.disabilities).toHaveLength(1);
    expect(profile.disabilities[0]?.code).toBe("M54.5");
  });

  it("removeDisability is a no-op for unknown code", () => {
    expect(() => minimalBuilder().removeDisability("NONEXISTENT").build()).not.toThrow();
  });

  it("multiple disabilities are preserved in insertion order", () => {
    const codes = ["A01", "B02", "C03"];
    let builder = minimalBuilder();
    for (const code of codes) {
      builder = builder.addDisability({ code, description: code, certified: true });
    }
    const profile = builder.build();
    expect(profile.disabilities.map((d) => d.code)).toEqual(codes);
  });
});

// ---------------------------------------------------------------------------
// Languages
// ---------------------------------------------------------------------------

describe("ProfileBuilder — languages", () => {
  it("addLanguage appends a BCP-47 tag", () => {
    const profile = minimalBuilder().addLanguage("fr").build();
    expect(profile.languages).toContain("fr");
  });

  it("addLanguage is idempotent for duplicate tags", () => {
    const profile = minimalBuilder().addLanguage("es").addLanguage("es").build();
    expect(profile.languages.filter((l) => l === "es")).toHaveLength(1);
  });

  it("removeLanguage removes the tag", () => {
    const profile = minimalBuilder()
      .addLanguage("en")
      .addLanguage("fr")
      .removeLanguage("en")
      .build();
    expect(profile.languages).not.toContain("en");
    expect(profile.languages).toContain("fr");
  });

  it("removeLanguage is a no-op for absent tag", () => {
    expect(() => minimalBuilder().removeLanguage("zh").build()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Custom fields
// ---------------------------------------------------------------------------

describe("ProfileBuilder — custom fields", () => {
  it("setCustomField stores a string value", () => {
    const profile = minimalBuilder().setCustomField("ns.key", "value").build();
    expect(profile.customFields.get("ns.key")).toBe("value");
  });

  it("setCustomField stores a numeric value", () => {
    const profile = minimalBuilder().setCustomField("ns.amount", 42_000).build();
    expect(profile.customFields.get("ns.amount")).toBe(42_000);
  });

  it("setCustomField stores a boolean value", () => {
    const profile = minimalBuilder().setCustomField("ns.flag", true).build();
    expect(profile.customFields.get("ns.flag")).toBe(true);
  });

  it("setCustomField stores an array value", () => {
    const profile = minimalBuilder().setCustomField("ns.list", ["a", "b", "c"]).build();
    expect(profile.customFields.get("ns.list")).toEqual(["a", "b", "c"]);
  });

  it("setCustomField overwrites an existing key", () => {
    const profile = minimalBuilder()
      .setCustomField("ns.key", "first")
      .setCustomField("ns.key", "second")
      .build();
    expect(profile.customFields.get("ns.key")).toBe("second");
  });

  it("removeCustomField removes the key", () => {
    const profile = minimalBuilder()
      .setCustomField("ns.key", "value")
      .removeCustomField("ns.key")
      .build();
    expect(profile.customFields.has("ns.key")).toBe(false);
  });

  it("removeCustomField is a no-op for absent key", () => {
    expect(() => minimalBuilder().removeCustomField("ghost").build()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// ProfileBuilder.from() — copy semantics
// ---------------------------------------------------------------------------

describe("ProfileBuilder.from()", () => {
  it("produces an identical profile", () => {
    const original = minimalBuilder().addLanguage("de").setCustomField("x", 1).build();
    const copy = ProfileBuilder.from(original).build();
    expect(copy.age).toBe(original.age);
    expect(copy.incomeAnnualCents).toBe(original.incomeAnnualCents);
    expect(copy.location).toEqual(original.location);
    expect(copy.familySize).toBe(original.familySize);
    expect(copy.employmentStatus).toBe(original.employmentStatus);
    expect(copy.citizenshipStatus).toBe(original.citizenshipStatus);
    expect([...copy.languages]).toEqual([...original.languages]);
    expect(copy.customFields.get("x")).toBe(1);
  });

  it("mutations to the copy do not affect the original", () => {
    const original = minimalBuilder().addLanguage("en").build();
    const modified = ProfileBuilder.from(original)
      .setAge(99)
      .removeLanguage("en")
      .addLanguage("zh")
      .build();
    // Original unchanged
    expect(original.age).toBe(25);
    expect(original.languages).toContain("en");
    // Modified version changed
    expect(modified.age).toBe(99);
    expect(modified.languages).toContain("zh");
    expect(modified.languages).not.toContain("en");
  });

  it("disabilities are copied independently", () => {
    const original = minimalBuilder()
      .addDisability({ code: "F32", description: "Depression", certified: true })
      .build();
    const modified = ProfileBuilder.from(original).removeDisability("F32").build();
    expect(original.disabilities).toHaveLength(1);
    expect(modified.disabilities).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// reset()
// ---------------------------------------------------------------------------

describe("ProfileBuilder.reset()", () => {
  it("clears all previously set fields", () => {
    const builder = minimalBuilder();
    builder.reset();
    expect(() => builder.build()).toThrow(); // required fields gone
  });

  it("returns the same builder instance", () => {
    const builder = new ProfileBuilder();
    expect(builder.reset()).toBe(builder);
  });
});

// ---------------------------------------------------------------------------
// Immutability
// ---------------------------------------------------------------------------

describe("Immutability of built profile", () => {
  it("built profile is frozen (top level)", () => {
    const profile = minimalBuilder().build();
    expect(Object.isFrozen(profile)).toBe(true);
  });

  it("disabilities array is frozen", () => {
    const profile = minimalBuilder()
      .addDisability({ code: "A01", description: "test", certified: false })
      .build();
    expect(Object.isFrozen(profile.disabilities)).toBe(true);
  });

  it("languages array is frozen", () => {
    const profile = minimalBuilder().addLanguage("en").build();
    expect(Object.isFrozen(profile.languages)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// build() reusability
// ---------------------------------------------------------------------------

describe("ProfileBuilder reusability", () => {
  it("calling build() twice returns equal profiles", () => {
    const builder = minimalBuilder();
    const a = builder.build();
    const b = builder.build();
    expect(a.age).toBe(b.age);
    expect(a.incomeAnnualCents).toBe(b.incomeAnnualCents);
  });

  it("modifying builder after first build does not affect first result", () => {
    const builder = minimalBuilder();
    const first = builder.build();
    builder.setAge(99);
    const second = builder.build();
    expect(first.age).toBe(25);
    expect(second.age).toBe(99);
  });
});
