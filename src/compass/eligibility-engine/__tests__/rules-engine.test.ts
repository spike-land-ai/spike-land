/**
 * COMPASS Eligibility Engine — Rules Engine Tests
 *
 * Covers:
 *   - Every Operator variant
 *   - Field resolution (top-level, dot-path, custom:)
 *   - Program evaluation (fully eligible, partially eligible, ineligible)
 *   - matchScore calculation
 *   - findEligiblePrograms ordering
 *   - explainDecision output structure
 *   - Edge cases: empty rules, missing fields, zero values, large inputs
 */

import { describe, expect, it } from "vitest";
import { ProfileBuilder } from "../core-logic/profile-builder.js";
import { RulesEngine } from "../core-logic/rules-engine.js";
import { CitizenshipStatus, EmploymentStatus, Operator } from "../types.js";
import type { EligibilityRule, Program, UserProfile } from "../types.js";

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------

const engine = new RulesEngine();

function buildBaseProfile(): UserProfile {
  return new ProfileBuilder()
    .setAge(35)
    .setIncome(3_000_000) // $30,000/yr in cents
    .setLocation({ countryCode: "US", regionCode: "CA" })
    .setFamilySize(3)
    .setEmploymentStatus(EmploymentStatus.unemployed)
    .setCitizenshipStatus(CitizenshipStatus.citizen)
    .addLanguage("en")
    .build();
}

function makeProgram(id: string, rules: EligibilityRule[]): Program {
  return {
    id,
    name: `Program ${id}`,
    jurisdiction: "US",
    rules,
    benefits: [
      {
        type: "monetary",
        description: "Monthly payment",
        estimatedAnnualValueCents: 12_000_00,
      },
    ],
    requiredDocuments: ["ID", "Proof of income"],
  };
}

// ---------------------------------------------------------------------------
// 1. evaluateRule — each operator
// ---------------------------------------------------------------------------

describe("RulesEngine.evaluateRule", () => {
  const profile = buildBaseProfile();

  describe("Operator.eq", () => {
    it("passes when field equals value", () => {
      const rule: EligibilityRule = {
        field: "age",
        operator: Operator.eq,
        value: 35,
      };
      expect(engine.evaluateRule(profile, rule)).toBe(true);
    });

    it("fails when field does not equal value", () => {
      const rule: EligibilityRule = {
        field: "age",
        operator: Operator.eq,
        value: 40,
      };
      expect(engine.evaluateRule(profile, rule)).toBe(false);
    });

    it("works on string fields", () => {
      const rule: EligibilityRule = {
        field: "employmentStatus",
        operator: Operator.eq,
        value: EmploymentStatus.unemployed,
      };
      expect(engine.evaluateRule(profile, rule)).toBe(true);
    });
  });

  describe("Operator.neq", () => {
    it("passes when field differs from value", () => {
      const rule: EligibilityRule = {
        field: "age",
        operator: Operator.neq,
        value: 40,
      };
      expect(engine.evaluateRule(profile, rule)).toBe(true);
    });

    it("fails when field equals value", () => {
      const rule: EligibilityRule = {
        field: "age",
        operator: Operator.neq,
        value: 35,
      };
      expect(engine.evaluateRule(profile, rule)).toBe(false);
    });
  });

  describe("Operator.gt / lt / gte / lte", () => {
    it("gt: passes when field > value", () => {
      expect(engine.evaluateRule(profile, { field: "age", operator: Operator.gt, value: 30 })).toBe(
        true,
      );
    });
    it("gt: fails when field === value", () => {
      expect(engine.evaluateRule(profile, { field: "age", operator: Operator.gt, value: 35 })).toBe(
        false,
      );
    });
    it("lt: passes when field < value", () => {
      expect(engine.evaluateRule(profile, { field: "age", operator: Operator.lt, value: 40 })).toBe(
        true,
      );
    });
    it("lt: fails when field > value", () => {
      expect(engine.evaluateRule(profile, { field: "age", operator: Operator.lt, value: 30 })).toBe(
        false,
      );
    });
    it("gte: passes when field === value (boundary)", () => {
      expect(
        engine.evaluateRule(profile, { field: "age", operator: Operator.gte, value: 35 }),
      ).toBe(true);
    });
    it("lte: passes when field === value (boundary)", () => {
      expect(
        engine.evaluateRule(profile, { field: "age", operator: Operator.lte, value: 35 }),
      ).toBe(true);
    });
    it("lte: fails when field > value", () => {
      expect(
        engine.evaluateRule(profile, { field: "age", operator: Operator.lte, value: 30 }),
      ).toBe(false);
    });
  });

  describe("Operator.in / notIn", () => {
    it("in: passes when value is in the array", () => {
      const rule: EligibilityRule = {
        field: "citizenshipStatus",
        operator: Operator.in,
        value: [CitizenshipStatus.citizen, CitizenshipStatus.permanentResident],
      };
      expect(engine.evaluateRule(profile, rule)).toBe(true);
    });

    it("in: fails when value is not in the array", () => {
      const rule: EligibilityRule = {
        field: "citizenshipStatus",
        operator: Operator.in,
        value: [CitizenshipStatus.refugee, CitizenshipStatus.temporaryVisa],
      };
      expect(engine.evaluateRule(profile, rule)).toBe(false);
    });

    it("notIn: passes when value is absent from array", () => {
      const rule: EligibilityRule = {
        field: "employmentStatus",
        operator: Operator.notIn,
        value: [EmploymentStatus.employed, EmploymentStatus.selfEmployed],
      };
      expect(engine.evaluateRule(profile, rule)).toBe(true);
    });

    it("notIn: fails when value is in the array", () => {
      const rule: EligibilityRule = {
        field: "employmentStatus",
        operator: Operator.notIn,
        value: [EmploymentStatus.unemployed],
      };
      expect(engine.evaluateRule(profile, rule)).toBe(false);
    });

    it("in: works with numeric values", () => {
      const rule: EligibilityRule = {
        field: "familySize",
        operator: Operator.in,
        value: [1, 2, 3, 4],
      };
      expect(engine.evaluateRule(profile, rule)).toBe(true);
    });
  });

  describe("Operator.contains", () => {
    it("passes when string field contains substring", () => {
      // employmentStatus = "unemployed", contains "employ"
      const rule: EligibilityRule = {
        field: "employmentStatus",
        operator: Operator.contains,
        value: "employ",
      };
      expect(engine.evaluateRule(profile, rule)).toBe(true);
    });

    it("fails when string field does not contain substring", () => {
      const rule: EligibilityRule = {
        field: "employmentStatus",
        operator: Operator.contains,
        value: "retired",
      };
      expect(engine.evaluateRule(profile, rule)).toBe(false);
    });

    it("passes when languages array contains the tag", () => {
      const rule: EligibilityRule = {
        field: "languages",
        operator: Operator.contains,
        value: "en",
      };
      expect(engine.evaluateRule(profile, rule)).toBe(true);
    });

    it("fails when languages array does not contain tag", () => {
      const rule: EligibilityRule = {
        field: "languages",
        operator: Operator.contains,
        value: "fr",
      };
      expect(engine.evaluateRule(profile, rule)).toBe(false);
    });
  });

  describe("Operator.exists", () => {
    it("passes for a field that is present", () => {
      const rule: EligibilityRule = {
        field: "age",
        operator: Operator.exists,
      };
      expect(engine.evaluateRule(profile, rule)).toBe(true);
    });

    it("passes for a custom field that exists", () => {
      const p = ProfileBuilder.from(profile).setCustomField("test.flag", true).build();
      const rule: EligibilityRule = {
        field: "custom:test.flag",
        operator: Operator.exists,
      };
      expect(engine.evaluateRule(p, rule)).toBe(true);
    });

    it("fails for a custom field that does not exist", () => {
      const rule: EligibilityRule = {
        field: "custom:nonexistent",
        operator: Operator.exists,
      };
      expect(engine.evaluateRule(profile, rule)).toBe(false);
    });

    it("fails for an unknown top-level field", () => {
      const rule: EligibilityRule = {
        field: "unknownField",
        operator: Operator.exists,
      };
      expect(engine.evaluateRule(profile, rule)).toBe(false);
    });
  });

  describe("Dot-path field resolution", () => {
    it("resolves location.countryCode correctly", () => {
      const rule: EligibilityRule = {
        field: "location.countryCode",
        operator: Operator.eq,
        value: "US",
      };
      expect(engine.evaluateRule(profile, rule)).toBe(true);
    });

    it("resolves location.regionCode correctly", () => {
      const rule: EligibilityRule = {
        field: "location.regionCode",
        operator: Operator.eq,
        value: "CA",
      };
      expect(engine.evaluateRule(profile, rule)).toBe(true);
    });

    it("fails when location.regionCode does not match", () => {
      const rule: EligibilityRule = {
        field: "location.regionCode",
        operator: Operator.eq,
        value: "TX",
      };
      expect(engine.evaluateRule(profile, rule)).toBe(false);
    });

    it("resolves location.postalCode (exists check) returns false when absent", () => {
      const rule: EligibilityRule = {
        field: "location.postalCode",
        operator: Operator.exists,
      };
      // Base profile has no postalCode
      expect(engine.evaluateRule(profile, rule)).toBe(false);
    });
  });

  describe("Custom field resolution", () => {
    it("resolves string custom field with eq", () => {
      const p = ProfileBuilder.from(profile)
        .setCustomField("us.snap.householdType", "renter")
        .build();
      const rule: EligibilityRule = {
        field: "custom:us.snap.householdType",
        operator: Operator.eq,
        value: "renter",
      };
      expect(engine.evaluateRule(p, rule)).toBe(true);
    });

    it("resolves numeric custom field with gte", () => {
      const p = ProfileBuilder.from(profile).setCustomField("us.snap.assetsCents", 500_000).build();
      const rule: EligibilityRule = {
        field: "custom:us.snap.assetsCents",
        operator: Operator.lte,
        value: 600_000,
      };
      expect(engine.evaluateRule(p, rule)).toBe(true);
    });
  });

  describe("Disability array with contains operator", () => {
    it("passes when disabilities contains the given code", () => {
      const p = ProfileBuilder.from(profile)
        .addDisability({ code: "M54.5", description: "Low back pain", certified: true })
        .build();
      const rule: EligibilityRule = {
        field: "disabilities",
        operator: Operator.contains,
        value: "M54.5",
      };
      expect(engine.evaluateRule(p, rule)).toBe(true);
    });

    it("fails when disabilities does not contain the code", () => {
      const rule: EligibilityRule = {
        field: "disabilities",
        operator: Operator.contains,
        value: "G35",
      };
      expect(engine.evaluateRule(profile, rule)).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("returns false for gt with missing field", () => {
      const rule: EligibilityRule = {
        field: "unknownNumericField",
        operator: Operator.gt,
        value: 0,
      };
      expect(engine.evaluateRule(profile, rule)).toBe(false);
    });

    it("eq with no value returns false", () => {
      const rule: EligibilityRule = {
        field: "age",
        operator: Operator.eq,
        // value intentionally omitted
      };
      expect(engine.evaluateRule(profile, rule)).toBe(false);
    });

    it("age zero passes gte 0", () => {
      const p = new ProfileBuilder()
        .setAge(0)
        .setIncome(0)
        .setLocation({ countryCode: "US" })
        .setFamilySize(1)
        .setEmploymentStatus(EmploymentStatus.notInLaborForce)
        .setCitizenshipStatus(CitizenshipStatus.citizen)
        .build();
      const rule: EligibilityRule = { field: "age", operator: Operator.gte, value: 0 };
      expect(engine.evaluateRule(p, rule)).toBe(true);
    });

    it("income zero passes lte 5000000", () => {
      const p = new ProfileBuilder()
        .setAge(25)
        .setIncome(0)
        .setLocation({ countryCode: "US" })
        .setFamilySize(1)
        .setEmploymentStatus(EmploymentStatus.unemployed)
        .setCitizenshipStatus(CitizenshipStatus.citizen)
        .build();
      const rule: EligibilityRule = {
        field: "incomeAnnualCents",
        operator: Operator.lte,
        value: 5_000_000,
      };
      expect(engine.evaluateRule(p, rule)).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// 2. evaluateProgram
// ---------------------------------------------------------------------------

describe("RulesEngine.evaluateProgram", () => {
  const profile = buildBaseProfile();

  it("returns eligible=true and matchScore=1 when all rules pass", () => {
    const program = makeProgram("PROG-1", [
      { field: "age", operator: Operator.gte, value: 18 },
      { field: "citizenshipStatus", operator: Operator.eq, value: CitizenshipStatus.citizen },
    ]);
    const result = engine.evaluateProgram(profile, program);
    expect(result.eligible).toBe(true);
    expect(result.matchScore).toBe(1);
    expect(result.missingCriteria).toHaveLength(0);
    expect(result.requiredActions).toHaveLength(0);
  });

  it("returns eligible=false when one rule fails", () => {
    const program = makeProgram("PROG-2", [
      { field: "age", operator: Operator.gte, value: 18 },
      { field: "age", operator: Operator.lte, value: 30 }, // fails: age=35
    ]);
    const result = engine.evaluateProgram(profile, program);
    expect(result.eligible).toBe(false);
    expect(result.missingCriteria).toHaveLength(1);
    expect(result.missingCriteria[0]?.field).toBe("age");
  });

  it("matchScore reflects partial satisfaction", () => {
    const program = makeProgram("PROG-3", [
      { field: "age", operator: Operator.gte, value: 18 }, // PASS
      { field: "age", operator: Operator.lte, value: 30 }, // FAIL
      { field: "familySize", operator: Operator.gte, value: 2 }, // PASS
      { field: "incomeAnnualCents", operator: Operator.gt, value: 1e10 }, // FAIL
    ]);
    const result = engine.evaluateProgram(profile, program);
    expect(result.eligible).toBe(false);
    expect(result.matchScore).toBeCloseTo(0.5, 5); // 2 of 4 rules pass
  });

  it("matchScore is 1 when there are no rules (open program)", () => {
    const program = makeProgram("PROG-OPEN", []);
    const result = engine.evaluateProgram(profile, program);
    expect(result.eligible).toBe(true);
    expect(result.matchScore).toBe(1);
  });

  it("programId in result matches the program id", () => {
    const program = makeProgram("ID-CHECK", []);
    const result = engine.evaluateProgram(profile, program);
    expect(result.programId).toBe("ID-CHECK");
  });

  it("requiredActions contains one action per failing rule", () => {
    const program = makeProgram("PROG-ACTIONS", [
      { field: "age", operator: Operator.lte, value: 25, label: "Max age 25" },
      {
        field: "incomeAnnualCents",
        operator: Operator.lte,
        value: 1_000_000,
        label: "Income below $10k",
      },
    ]);
    const result = engine.evaluateProgram(profile, program);
    expect(result.requiredActions).toHaveLength(2);
    expect(result.requiredActions[0]).toContain("Max age 25");
    expect(result.requiredActions[1]).toContain("Income below $10k");
  });
});

// ---------------------------------------------------------------------------
// 3. findEligiblePrograms
// ---------------------------------------------------------------------------

describe("RulesEngine.findEligiblePrograms", () => {
  const profile = buildBaseProfile(); // age=35, income=$30k, familySize=3

  const snapProgram = makeProgram("SNAP", [
    { field: "incomeAnnualCents", operator: Operator.lte, value: 5_000_000 },
    {
      field: "citizenshipStatus",
      operator: Operator.in,
      value: [CitizenshipStatus.citizen, CitizenshipStatus.permanentResident],
    },
  ]);

  const medicaidProgram = makeProgram("MEDICAID", [
    { field: "incomeAnnualCents", operator: Operator.lte, value: 4_500_000 },
    { field: "familySize", operator: Operator.gte, value: 1 },
  ]);

  const wealthyProgram = makeProgram("WEALTHY-ONLY", [
    { field: "incomeAnnualCents", operator: Operator.gte, value: 10_000_000 },
  ]);

  const programs = [snapProgram, medicaidProgram, wealthyProgram];

  it("returns all programs sorted by matchScore descending", () => {
    const results = engine.findEligiblePrograms(profile, programs);
    expect(results).toHaveLength(3);
    // Eligible programs (score 1.0) must come first
    expect(results[0]!.eligible).toBe(true);
    expect(results[1]!.eligible).toBe(true);
    // Ineligible last
    expect(results[2]!.eligible).toBe(false);
    expect(results[2]!.programId).toBe("WEALTHY-ONLY");
  });

  it("returns empty array for empty program list", () => {
    const results = engine.findEligiblePrograms(profile, []);
    expect(results).toHaveLength(0);
  });

  it("returns a result for every program in the input", () => {
    const results = engine.findEligiblePrograms(profile, programs);
    const ids = results.map((r) => r.programId);
    expect(ids).toContain("SNAP");
    expect(ids).toContain("MEDICAID");
    expect(ids).toContain("WEALTHY-ONLY");
  });

  it("eligible programs have matchScore exactly 1", () => {
    const results = engine.findEligiblePrograms(profile, programs);
    const eligible = results.filter((r) => r.eligible);
    for (const r of eligible) {
      expect(r.matchScore).toBe(1);
    }
  });

  it("is deterministic — same call produces identical results", () => {
    const a = engine.findEligiblePrograms(profile, programs);
    const b = engine.findEligiblePrograms(profile, programs);
    expect(a.map((r) => r.programId)).toEqual(b.map((r) => r.programId));
    expect(a.map((r) => r.matchScore)).toEqual(b.map((r) => r.matchScore));
  });

  it("handles a profile that qualifies for no programs", () => {
    const richProfile = new ProfileBuilder()
      .setAge(60)
      .setIncome(50_000_000) // $500k — too high for SNAP/Medicaid
      .setLocation({ countryCode: "US" })
      .setFamilySize(1)
      .setEmploymentStatus(EmploymentStatus.employed)
      .setCitizenshipStatus(CitizenshipStatus.citizen)
      .build();
    const results = engine.findEligiblePrograms(richProfile, [snapProgram, medicaidProgram]);
    expect(results.every((r) => !r.eligible)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 4. explainDecision
// ---------------------------------------------------------------------------

describe("RulesEngine.explainDecision", () => {
  const profile = buildBaseProfile();

  it("includes the program name and id in the output", () => {
    const program = makeProgram("EXPLAIN-TEST", [
      { field: "age", operator: Operator.gte, value: 18 },
    ]);
    const lines = engine.explainDecision(profile, program);
    const text = lines.join("\n");
    expect(text).toContain("EXPLAIN-TEST");
    expect(text).toContain("Program EXPLAIN-TEST");
  });

  it("marks eligible programs with ELIGIBLE", () => {
    const program = makeProgram("ELIG-PROG", [{ field: "age", operator: Operator.gte, value: 18 }]);
    const lines = engine.explainDecision(profile, program);
    expect(lines.some((l) => l.includes("ELIGIBLE"))).toBe(true);
    expect(lines.some((l) => l.includes("INELIGIBLE"))).toBe(false);
  });

  it("marks ineligible programs with INELIGIBLE", () => {
    const program = makeProgram("INELIG-PROG", [
      { field: "age", operator: Operator.lte, value: 25 },
    ]);
    const lines = engine.explainDecision(profile, program);
    expect(lines.some((l) => l.includes("INELIGIBLE"))).toBe(true);
  });

  it("lists passing criteria with PASS prefix", () => {
    const program = makeProgram("PASS-FAIL", [
      { field: "age", operator: Operator.gte, value: 18, label: "Must be 18+" },
      { field: "age", operator: Operator.lte, value: 25, label: "Must be 25 or younger" },
    ]);
    const lines = engine.explainDecision(profile, program);
    expect(lines.some((l) => l.includes("PASS") && l.includes("Must be 18+"))).toBe(true);
    expect(lines.some((l) => l.includes("FAIL") && l.includes("Must be 25 or younger"))).toBe(true);
  });

  it("includes the actual profile value in FAIL lines", () => {
    const program = makeProgram("ACTUAL-VAL", [
      { field: "age", operator: Operator.lte, value: 25 },
    ]);
    const lines = engine.explainDecision(profile, program);
    // Age is 35, should appear in the FAIL line
    const failLine = lines.find((l) => l.includes("FAIL"));
    expect(failLine).toBeDefined();
    expect(failLine).toContain("35");
  });

  it("handles program with no rules gracefully", () => {
    const program = makeProgram("NO-RULES", []);
    const lines = engine.explainDecision(profile, program);
    expect(lines.some((l) => l.includes("No eligibility rules"))).toBe(true);
  });

  it("includes required actions section for ineligible programs", () => {
    const program = makeProgram("ACTIONS-PROG", [
      { field: "age", operator: Operator.lte, value: 25, label: "Age limit" },
    ]);
    const lines = engine.explainDecision(profile, program);
    expect(lines.some((l) => l.includes("Required actions"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5. Full end-to-end scenarios
// ---------------------------------------------------------------------------

describe("End-to-end scenarios", () => {
  it("SNAP eligibility: household with qualifying income", () => {
    const profile = new ProfileBuilder()
      .setAge(28)
      .setIncome(2_400_000) // $24k/yr
      .setLocation({ countryCode: "US", regionCode: "TX" })
      .setFamilySize(4)
      .setEmploymentStatus(EmploymentStatus.employed)
      .setCitizenshipStatus(CitizenshipStatus.citizen)
      .build();

    const snap: Program = {
      id: "SNAP-2024",
      name: "Supplemental Nutrition Assistance Program",
      jurisdiction: "US",
      rules: [
        {
          field: "citizenshipStatus",
          operator: Operator.in,
          value: [CitizenshipStatus.citizen, CitizenshipStatus.permanentResident],
          label: "Citizenship",
        },
        {
          field: "incomeAnnualCents",
          operator: Operator.lte,
          value: 3_700_000,
          label: "Gross income ≤ 130% FPL (family of 4)",
        },
        { field: "familySize", operator: Operator.gte, value: 1, label: "Household size ≥ 1" },
      ],
      benefits: [
        { type: "voucher", description: "Food voucher", estimatedAnnualValueCents: 900_00 },
      ],
      requiredDocuments: ["SSN", "Proof of income", "Proof of residency"],
    };

    const result = engine.evaluateProgram(profile, snap);
    expect(result.eligible).toBe(true);
    expect(result.matchScore).toBe(1);
  });

  it("Senior program: rejects applicant under 65", () => {
    const profile = buildBaseProfile(); // age=35

    const seniorProgram: Program = {
      id: "SENIOR-AID",
      name: "Senior Assistance Program",
      jurisdiction: "US",
      rules: [{ field: "age", operator: Operator.gte, value: 65, label: "Must be 65 or older" }],
      benefits: [{ type: "service", description: "Home care" }],
      requiredDocuments: ["Birth certificate"],
    };

    const result = engine.evaluateProgram(profile, seniorProgram);
    expect(result.eligible).toBe(false);
    expect(result.missingCriteria[0]?.label).toBe("Must be 65 or older");
  });

  it("Disability program matches only certified disabilities", () => {
    const profileWithDisability = ProfileBuilder.from(buildBaseProfile())
      .addDisability({ code: "F32", description: "Major depressive disorder", certified: true })
      .build();

    const disabilityProgram: Program = {
      id: "DISABILITY-AID",
      name: "Disability Assistance",
      jurisdiction: "US",
      rules: [
        {
          field: "disabilities",
          operator: Operator.contains,
          value: "F32",
          label: "Must have diagnosed depression (ICD F32)",
        },
      ],
      benefits: [
        { type: "monetary", description: "Monthly support", estimatedAnnualValueCents: 6_000_00 },
      ],
      requiredDocuments: ["Medical certification"],
    };

    expect(engine.evaluateProgram(profileWithDisability, disabilityProgram).eligible).toBe(true);
    expect(engine.evaluateProgram(buildBaseProfile(), disabilityProgram).eligible).toBe(false);
  });

  it("Multilingual program only for Spanish speakers", () => {
    const spanishProfile = ProfileBuilder.from(buildBaseProfile()).addLanguage("es").build();

    const program: Program = {
      id: "BILINGUAL-SVC",
      name: "Bilingual Services Program",
      jurisdiction: "US-CA",
      rules: [
        {
          field: "languages",
          operator: Operator.contains,
          value: "es",
          label: "Must speak Spanish",
        },
        {
          field: "location.regionCode",
          operator: Operator.eq,
          value: "CA",
          label: "Must be in California",
        },
      ],
      benefits: [{ type: "service", description: "Bilingual case management" }],
      requiredDocuments: [],
    };

    expect(engine.evaluateProgram(spanishProfile, program).eligible).toBe(true);
    expect(engine.evaluateProgram(buildBaseProfile(), program).eligible).toBe(false);
  });

  it("Custom field rule used for jurisdictional eligibility", () => {
    const profileWithCustom = ProfileBuilder.from(buildBaseProfile())
      .setCustomField("us.medicaid.categoryCode", "MAGI")
      .build();

    const program: Program = {
      id: "MEDICAID-MAGI",
      name: "Medicaid MAGI Category",
      jurisdiction: "US",
      rules: [
        { field: "custom:us.medicaid.categoryCode", operator: Operator.eq, value: "MAGI" },
        { field: "incomeAnnualCents", operator: Operator.lte, value: 5_000_000 },
      ],
      benefits: [
        { type: "service", description: "Health coverage", estimatedAnnualValueCents: 10_000_00 },
      ],
      requiredDocuments: ["SSN", "Proof of income"],
    };

    expect(engine.evaluateProgram(profileWithCustom, program).eligible).toBe(true);
    // Without custom field
    expect(engine.evaluateProgram(buildBaseProfile(), program).eligible).toBe(false);
  });
});
