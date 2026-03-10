/**
 * COMPASS Eligibility Engine — Profile Builder
 *
 * Fluent builder for UserProfile. Each setter returns `this` so calls can be
 * chained. `build()` performs validation and returns a frozen, immutable
 * UserProfile.
 *
 * The builder is intentionally separate from the type definition so that
 * compiled downstream code can construct profiles without depending on a
 * runtime class hierarchy.
 */

import type {
  CitizenshipStatus,
  CustomFieldValue,
  Disability,
  EmploymentStatus,
  Location,
  UserProfile,
} from "../types.js";

// ---------------------------------------------------------------------------
// Mutable internal state (not exposed)
// ---------------------------------------------------------------------------

interface MutableProfile {
  age: number | undefined;
  incomeAnnualCents: number | undefined;
  location: Location | undefined;
  familySize: number | undefined;
  disabilities: Disability[];
  employmentStatus: EmploymentStatus | undefined;
  citizenshipStatus: CitizenshipStatus | undefined;
  languages: string[];
  customFields: Map<string, CustomFieldValue>;
}

function emptyState(): MutableProfile {
  return {
    age: undefined,
    incomeAnnualCents: undefined,
    location: undefined,
    familySize: undefined,
    disabilities: [],
    employmentStatus: undefined,
    citizenshipStatus: undefined,
    languages: [],
    customFields: new Map(),
  };
}

// ---------------------------------------------------------------------------
// ProfileBuilder class
// ---------------------------------------------------------------------------

export class ProfileBuilder {
  private state: MutableProfile = emptyState();

  /**
   * Start a fresh builder, discarding any previously set fields.
   */
  reset(): this {
    this.state = emptyState();
    return this;
  }

  /**
   * Age in whole years. Must be >= 0.
   */
  setAge(age: number): this {
    if (!Number.isInteger(age) || age < 0) {
      throw new RangeError(`age must be a non-negative integer, got: ${age}`);
    }
    this.state.age = age;
    return this;
  }

  /**
   * Annual gross income expressed in the smallest currency unit (cents/pence).
   * Must be >= 0.
   */
  setIncome(annualCents: number): this {
    if (!Number.isInteger(annualCents) || annualCents < 0) {
      throw new RangeError(`incomeAnnualCents must be a non-negative integer, got: ${annualCents}`);
    }
    this.state.incomeAnnualCents = annualCents;
    return this;
  }

  /**
   * Set geographic location. At minimum a countryCode is required.
   * countryCode must be a valid ISO 3166-1 alpha-2 string (two uppercase letters).
   */
  setLocation(location: Location): this {
    if (!/^[A-Z]{2}$/.test(location.countryCode)) {
      throw new TypeError(
        `location.countryCode must be ISO 3166-1 alpha-2 (two uppercase letters), got: "${location.countryCode}"`,
      );
    }
    this.state.location = location;
    return this;
  }

  /**
   * Number of people in the household (including the applicant). Must be >= 1.
   */
  setFamilySize(size: number): this {
    if (!Number.isInteger(size) || size < 1) {
      throw new RangeError(`familySize must be a positive integer, got: ${size}`);
    }
    this.state.familySize = size;
    return this;
  }

  /**
   * Add a single disability to the profile.
   * Adding the same disability code multiple times is idempotent — the first
   * entry with that code is kept and later ones are ignored.
   */
  addDisability(disability: Disability): this {
    const existing = this.state.disabilities.some((d) => d.code === disability.code);
    if (!existing) {
      this.state.disabilities.push(disability);
    }
    return this;
  }

  /**
   * Remove a disability by code. No-op if the code is not present.
   */
  removeDisability(code: string): this {
    this.state.disabilities = this.state.disabilities.filter((d) => d.code !== code);
    return this;
  }

  setEmploymentStatus(status: EmploymentStatus): this {
    this.state.employmentStatus = status;
    return this;
  }

  setCitizenshipStatus(status: CitizenshipStatus): this {
    this.state.citizenshipStatus = status;
    return this;
  }

  /**
   * Add a BCP-47 language tag (e.g. "en", "fr-CA").
   * Duplicate tags are ignored.
   */
  addLanguage(bcp47Tag: string): this {
    if (!this.state.languages.includes(bcp47Tag)) {
      this.state.languages.push(bcp47Tag);
    }
    return this;
  }

  /**
   * Remove a language tag. No-op if not present.
   */
  removeLanguage(bcp47Tag: string): this {
    this.state.languages = this.state.languages.filter((l) => l !== bcp47Tag);
    return this;
  }

  /**
   * Set a custom field. Keys should be namespaced to avoid collisions:
   * "us.snap.householdType", "uk.universalCredit.claimant", etc.
   */
  setCustomField(key: string, value: CustomFieldValue): this {
    this.state.customFields.set(key, value);
    return this;
  }

  /**
   * Remove a custom field. No-op if not present.
   */
  removeCustomField(key: string): this {
    this.state.customFields.delete(key);
    return this;
  }

  /**
   * Build and return an immutable UserProfile.
   * Throws if required fields have not been set.
   */
  build(): UserProfile {
    const missing: string[] = [];
    if (this.state.age === undefined) missing.push("age");
    if (this.state.incomeAnnualCents === undefined) missing.push("incomeAnnualCents");
    if (this.state.location === undefined) missing.push("location");
    if (this.state.familySize === undefined) missing.push("familySize");
    if (this.state.employmentStatus === undefined) missing.push("employmentStatus");
    if (this.state.citizenshipStatus === undefined) missing.push("citizenshipStatus");

    if (missing.length > 0) {
      throw new Error(`ProfileBuilder.build(): missing required fields: ${missing.join(", ")}`);
    }

    // At this point all required fields are defined — the non-null assertions
    // are safe because we validated above.
    const profile: UserProfile = {
      age: this.state.age!,
      incomeAnnualCents: this.state.incomeAnnualCents!,
      location: this.state.location!,
      familySize: this.state.familySize!,
      disabilities: Object.freeze([...this.state.disabilities]),
      employmentStatus: this.state.employmentStatus!,
      citizenshipStatus: this.state.citizenshipStatus!,
      languages: Object.freeze([...this.state.languages]),
      customFields: new Map(this.state.customFields),
    };

    return Object.freeze(profile);
  }

  /**
   * Convenience: create a builder and optionally seed it from an existing
   * UserProfile (useful for creating variations).
   */
  static from(profile: UserProfile): ProfileBuilder {
    const b = new ProfileBuilder();
    b.state.age = profile.age;
    b.state.incomeAnnualCents = profile.incomeAnnualCents;
    b.state.location = profile.location;
    b.state.familySize = profile.familySize;
    b.state.disabilities = [...profile.disabilities];
    b.state.employmentStatus = profile.employmentStatus;
    b.state.citizenshipStatus = profile.citizenshipStatus;
    b.state.languages = [...profile.languages];
    b.state.customFields = new Map(profile.customFields);
    return b;
  }
}
