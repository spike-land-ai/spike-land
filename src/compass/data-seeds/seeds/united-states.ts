/**
 * COMPASS Seed Data — United States of America
 *
 * Focus domain: Low-income benefits
 * Key programs: SNAP, Medicaid, Section 8 (HCV), EITC, WIC, SSI
 * Key institutions: USDA FNS, CMS, HUD, IRS, state DSS offices, legal aid
 *
 * Programs are federally defined but state-administered — eligibility thresholds,
 * application procedures, and wait times vary significantly by state.
 * Data reflects federal baseline rules as of early 2026.
 * All monetary amounts in USD; income thresholds reference federal poverty level (FPL).
 */

import type { CountrySeed } from "../types.js";

export const unitedStatesSeed: CountrySeed = {
  jurisdiction: {
    id: "jurisdiction-us",
    name: "United States of America",
    code: "US",
    languages: ["en", "es"],
    currency: "USD",
    governmentType: "Federal presidential constitutional republic",
  },

  // -------------------------------------------------------------------------
  // Programs
  // -------------------------------------------------------------------------
  programs: [
    {
      id: "us-program-snap",
      name: "SNAP (Supplemental Nutrition Assistance Program)",
      description:
        "Federal nutrition assistance programme providing monthly benefits on an EBT (Electronic Benefit " +
        "Transfer) card for purchasing food at authorised retailers. " +
        "Administered by the USDA Food and Nutrition Service (FNS) but delivered through state agencies. " +
        "Average monthly benefit: ~$187 per person (FY2025). Formerly known as Food Stamps.",
      jurisdiction: "US",
      domain: "nutrition",
      benefits:
        "Monthly EBT card benefits averaging $187/person/month (varies by household size and income); " +
        "can be used at supermarkets, farmers markets, and online at Amazon/Walmart.",
      eligibilityCriteria: [
        {
          field: "location.countryCode",
          operator: "eq",
          value: "US",
          description: "Must be a US resident",
        },
        {
          field: "citizenshipStatus",
          operator: "in",
          value: ["citizen", "permanentResident"],
          description:
            "Must be a US citizen or qualified alien (LPR with 5+ years residency, refugees, asylees, " +
            "and certain other categories exempt from the 5-year bar)",
        },
        {
          field: "incomeAnnualCents",
          operator: "lte",
          value: 2395200,
          description:
            "Gross monthly income must be at or below 130% of the Federal Poverty Level " +
            "($1,996/month for a family of 3 in FY2026). Net income must be at or below 100% FPL.",
        },
        {
          field: "custom:us.snap.resourceLimit",
          operator: "lte",
          value: 275000,
          description:
            "Countable resources (bank accounts, non-exempt assets) must not exceed $2,750 " +
            "(or $4,250 for households with a member aged 60+ or disabled)",
        },
        {
          field: "custom:us.snap.workRequirementMet",
          operator: "eq",
          value: true,
          description:
            "Able-bodied adults without dependents (ABAWDs) aged 18–52 must meet work/training requirements " +
            "(20 hrs/week) or have a waiver; most households are exempt",
        },
      ],
      requiredDocuments: [
        "Proof of identity (driver's license, state ID, passport, birth certificate)",
        "Proof of residency (utility bill, lease, mail with current address)",
        "Proof of income for all household members (pay stubs, employer letter, SSA award letter)",
        "Social Security Numbers for all US citizens/qualified aliens in household",
        "Proof of immigration status if non-citizen (green card, refugee resettlement letter, etc.)",
        "Bank statements (last 30 days) for resource verification",
        "Utility bills (for heat and utility deduction calculation)",
      ],
      applicationUrl: "https://www.fns.usda.gov/snap/state-directory",
      deadline: "Rolling — apply at any time; benefits begin within 30 days (7 days for expedited)",
    },

    {
      id: "us-program-medicaid",
      name: "Medicaid (Federal-State Health Insurance for Low-Income Individuals)",
      description:
        "Joint federal-state health insurance programme providing free or low-cost health coverage to " +
        "eligible low-income adults, children, pregnant women, elderly, and people with disabilities. " +
        "Under the ACA Medicaid expansion (adopted by 40+ states), adults up to 138% FPL qualify. " +
        "Administered by state Medicaid agencies with federal CMS oversight.",
      jurisdiction: "US",
      domain: "health",
      benefits:
        "Comprehensive health coverage: doctor visits, hospital care, preventive care, mental health, " +
        "substance use disorder treatment, prescription drugs, dental (adults: varies by state), vision; " +
        "$0 or very low premiums and copays.",
      eligibilityCriteria: [
        {
          field: "location.countryCode",
          operator: "eq",
          value: "US",
          description: "Must be a US resident in a Medicaid-participating state",
        },
        {
          field: "citizenshipStatus",
          operator: "in",
          value: ["citizen", "permanentResident"],
          description:
            "Must be a US citizen or qualified alien (refugees/asylees eligible regardless of 5-year bar; " +
            "DACA recipients: varies by state)",
        },
        {
          field: "incomeAnnualCents",
          operator: "lte",
          value: 2006400,
          description:
            "Income must be at or below 138% FPL ($20,064/year for a single adult in 2026) in expansion states; " +
            "lower thresholds apply in non-expansion states for adults without children",
        },
        {
          field: "custom:us.medicaid.categoryMet",
          operator: "eq",
          value: true,
          description:
            "Must meet a categorical requirement: low-income adult (expansion), child, pregnant woman, " +
            "parent/caretaker, elderly (65+), or disabled (SSI-linked) in non-expansion states",
        },
      ],
      requiredDocuments: [
        "Proof of identity (driver's license or birth certificate + photo ID)",
        "Proof of US citizenship or immigration status",
        "Social Security Number",
        "Proof of state residency",
        "Proof of income (tax return, recent pay stubs, SSA benefit letter)",
        "Household size documentation (birth certificates for children)",
      ],
      applicationUrl: "https://www.healthcare.gov/medicaid-chip/getting-medicaid-chip/",
    },

    {
      id: "us-program-section8",
      name: "Section 8 Housing Choice Voucher (HCV) Program",
      description:
        "Federal rental assistance programme enabling very low-income households to rent safe, decent " +
        "housing in the private market. The voucher covers the difference between the actual rent and " +
        "30% of the family's adjusted monthly income. " +
        "Administered by local Public Housing Authorities (PHAs) with HUD oversight. " +
        "Due to severe funding shortfalls, most PHAs have multi-year waiting lists.",
      jurisdiction: "US",
      domain: "housing",
      benefits:
        "Monthly rental subsidy directly paid by PHA to landlord; " +
        "family pays approximately 30% of adjusted monthly income toward rent; " +
        "portable vouchers can be used in any jurisdiction with a participating PHA.",
      eligibilityCriteria: [
        {
          field: "location.countryCode",
          operator: "eq",
          value: "US",
          description: "Must be a US resident applying to a local PHA",
        },
        {
          field: "citizenshipStatus",
          operator: "in",
          value: ["citizen", "permanentResident"],
          description:
            "At least one household member must be a US citizen or eligible immigrant; " +
            "mixed-status households qualify on a prorated basis",
        },
        {
          field: "incomeAnnualCents",
          operator: "lte",
          value: 3500000,
          description:
            "Income must be at or below 50% of Area Median Income (AMI) — approximately $35,000 for a " +
            "family of 3 in a median-income area; PHAs must serve 75% of vouchers to households at or below 30% AMI",
        },
        {
          field: "custom:us.hud.passedBackgroundCheck",
          operator: "eq",
          value: true,
          description:
            "Must pass PHA criminal background check; lifetime sex offender registrants are permanently ineligible",
        },
      ],
      requiredDocuments: [
        "Photo ID for all adult household members",
        "Birth certificates for all household members",
        "Social Security Cards for all household members",
        "Proof of income (pay stubs, tax returns, SSA/SSI award letters, child support orders)",
        "Proof of immigration status for non-citizen household members",
        "Previous rental history / landlord references",
        "Criminal background disclosure (PHAs conduct independent checks)",
      ],
      applicationUrl: "https://www.hud.gov/topics/housing_choice_voucher_program_section_8",
    },

    {
      id: "us-program-eitc",
      name: "Earned Income Tax Credit (EITC)",
      description:
        "Refundable federal tax credit for working individuals and families with low to moderate incomes. " +
        "The credit is 'refundable' — if the credit exceeds taxes owed, the difference is paid as a cash refund. " +
        "Maximum credit for tax year 2025: $7,830 (three or more qualifying children). " +
        "Claimed on annual federal tax return (Form 1040 + Schedule EIC). " +
        "Many states have their own EITC on top of the federal credit.",
      jurisdiction: "US",
      domain: "employment",
      benefits:
        "Refundable tax credit of $632 (no children) up to $7,830 (3+ children) for TY2025; " +
        "state EITC adds 10–100% of federal credit in 30+ states; " +
        "paid as lump sum tax refund in February–April.",
      eligibilityCriteria: [
        {
          field: "custom:us.eitc.hasEarnedIncome",
          operator: "eq",
          value: true,
          description:
            "Must have earned income (wages, salary, self-employment) — investment income alone does not qualify",
        },
        {
          field: "incomeAnnualCents",
          operator: "lte",
          value: 5978200,
          description:
            "Earned and adjusted gross income must not exceed $59,782 (three children, married filing jointly, TY2025); " +
            "lower thresholds for fewer children and single filers",
        },
        {
          field: "custom:us.eitc.investmentIncome",
          operator: "lte",
          value: 1170000,
          description: "Investment income must not exceed $11,700 for the year (TY2025)",
        },
        {
          field: "age",
          operator: "gte",
          value: 25,
          description:
            "Workers without a qualifying child must be at least 25 (under 65) to claim the credit for no-child filers; " +
            "no age requirement when a qualifying child is claimed",
        },
        {
          field: "custom:us.eitc.validSSN",
          operator: "eq",
          value: true,
          description:
            "Must have a valid Social Security Number (SSN) that is valid for employment",
        },
      ],
      requiredDocuments: [
        "Social Security Card (or ITIN for spouses/dependents in some cases)",
        "Form W-2 (wage and salary statement from employer)",
        "Form 1099-MISC or Schedule C (if self-employed)",
        "Records of all income sources for the tax year",
        "Qualifying child's SSN and birth certificate (if claiming child EITC)",
        "Bank account information (for direct deposit of refund)",
      ],
      applicationUrl: "https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit",
      deadline: "April 15 of the following year (tax filing deadline); 3-year lookback allowed",
    },

    {
      id: "us-program-wic",
      name: "WIC (Special Supplemental Nutrition Program for Women, Infants, and Children)",
      description:
        "Federal supplemental nutrition programme providing food benefits, nutrition education, " +
        "breastfeeding support, and healthcare referrals to low-income pregnant women, postpartum women, " +
        "breastfeeding women, and children under 5. " +
        "Benefits are provided on a WIC EBT card or paper vouchers for specific nutritious foods.",
      jurisdiction: "US",
      domain: "nutrition",
      benefits:
        "Monthly food packages worth $30–$60/month for pregnant/postpartum women; " +
        "$8–$25/month for infants (formula or breastfeeding support); " +
        "nutrition counselling, breastfeeding peer counsellors, and healthcare referrals at no cost.",
      eligibilityCriteria: [
        {
          field: "location.countryCode",
          operator: "eq",
          value: "US",
          description: "Must be a US resident",
        },
        {
          field: "custom:us.wic.categoricalEligibility",
          operator: "in",
          value: [
            "pregnantWoman",
            "postpartumWoman",
            "breastfeedingWoman",
            "infantUnder1",
            "childUnder5",
          ],
          description:
            "Must be a pregnant woman (during pregnancy), postpartum woman (up to 6 months after birth/end of pregnancy), " +
            "breastfeeding woman (up to 12 months), infant under 1 year, or child under 5",
        },
        {
          field: "incomeAnnualCents",
          operator: "lte",
          value: 3900000,
          description:
            "Household income must be at or below 185% FPL (~$39,000 for a family of 3 in 2026); " +
            "automatic eligibility if receiving SNAP, Medicaid, or TANF",
        },
        {
          field: "custom:us.wic.nutritionalRiskMet",
          operator: "eq",
          value: true,
          description:
            "Must be determined to be at nutritional risk by a WIC health professional — " +
            "almost all applicants meeting income and categorical criteria qualify",
        },
      ],
      requiredDocuments: [
        "Proof of identity (birth certificate, driver's license, Medicaid card)",
        "Proof of residency (utility bill, lease, mail)",
        "Proof of income (pay stubs, SNAP/Medicaid enrollment letter as categorical eligibility)",
        "Proof of pregnancy (letter from doctor or midwife)",
        "Child's birth certificate or hospital discharge summary (for infant/child applicants)",
      ],
      applicationUrl: "https://www.fns.usda.gov/wic/wic-how-apply",
    },

    {
      id: "us-program-ssi",
      name: "SSI (Supplemental Security Income)",
      description:
        "Federal programme providing cash benefits to aged, blind, and disabled individuals with " +
        "limited income and resources. SSI is need-based, not tied to work history. " +
        "Administered by the Social Security Administration (SSA). " +
        "Federal benefit rate: $967/month for individuals, $1,450/month for eligible couples (2026). " +
        "Many states supplement the federal rate.",
      jurisdiction: "US",
      domain: "social-protection",
      benefits:
        "Federal benefit of $967/month (individual) or $1,450/month (couple) plus state supplement (varies); " +
        "automatic Medicaid eligibility in most states; " +
        "SNAP eligibility in most states (automatic for SSI recipients).",
      eligibilityCriteria: [
        {
          field: "location.countryCode",
          operator: "eq",
          value: "US",
          description: "Must be a US resident",
        },
        {
          field: "citizenshipStatus",
          operator: "in",
          value: ["citizen", "permanentResident"],
          description:
            "Must be a US citizen or a qualified alien meeting one of the SSI-eligible immigration categories " +
            "(refugees, asylees, certain veterans — 5-year bar applies to most LPRs except elderly/disabled)",
        },
        {
          field: "custom:us.ssi.categoryMet",
          operator: "in",
          value: ["age65OrOlder", "blind", "disabled"],
          description:
            "Must be 65 or older, legally blind, or have a qualifying disability (physical or mental)",
        },
        {
          field: "incomeAnnualCents",
          operator: "lte",
          value: 1160400,
          description:
            "Countable monthly income must be below the Federal Benefit Rate ($967/month in 2026); " +
            "SSA applies complex income exclusions — first $20/month excluded, then $65 earned income + 1/2 of remainder",
        },
        {
          field: "custom:us.ssi.resources",
          operator: "lte",
          value: 200000,
          description:
            "Countable resources must not exceed $2,000 for individuals or $3,000 for couples " +
            "(home, one vehicle, and personal effects are excluded)",
        },
      ],
      requiredDocuments: [
        "Social Security card",
        "Birth certificate or proof of age",
        "Proof of US citizenship or immigration status",
        "Proof of residency",
        "Medical records and treatment history documenting disability (for disability claims)",
        "Contact information for all doctors, hospitals, clinics",
        "Income records for all household members",
        "Bank statements and asset documentation",
        "School records (for disabled children)",
      ],
      applicationUrl: "https://www.ssa.gov/ssi/apply",
    },
  ],

  // -------------------------------------------------------------------------
  // Processes
  // -------------------------------------------------------------------------
  processes: [
    {
      id: "us-process-snap-application",
      programId: "us-program-snap",
      name: "SNAP Application and Certification",
      estimatedDuration: "30 days (7 days for expedited/emergency SNAP)",
      cost: "Free",
      steps: [
        {
          id: "us-step-snap-1",
          order: 1,
          title: "Determine Eligibility and Gather Documents",
          description:
            "Use the SNAP pre-screening tool at benefits.gov or your state agency website to estimate " +
            "eligibility. Gather all required documents. Note: even undocumented immigrants may apply " +
            "on behalf of their US citizen children.",
          location: "Online (benefits.gov) or state SNAP office",
          documents: [
            "Photo ID for all adult applicants",
            "SSNs for all household members who are US citizens or qualified aliens",
            "Proof of income (last 30 days pay stubs, benefit award letters)",
            "Utility bills (for utility deduction)",
          ],
          tips: [
            "You can apply with an incomplete application — you have 30 days to submit missing documents.",
            "Check whether your state has broad-based categorical eligibility (BBCE), which may waive resource tests.",
          ],
        },
        {
          id: "us-step-snap-2",
          order: 2,
          title: "Submit Application (Online, In-Person, or Mail)",
          description:
            "Most states offer online SNAP applications through their DSS or DHS websites. " +
            "You may also apply in person at a county Department of Social Services (DSS) office " +
            "or mail a paper application. Your eligibility begin date is the date your application is received.",
          location: "State SNAP office (online portal, in-person, or mail)",
          documents: [
            "Completed state-specific application form",
            "All supporting documents gathered in Step 1",
          ],
          tips: [
            "Apply online first to lock in your application date, then submit documentation within 30 days.",
            "Request an emergency (expedited) determination if: gross monthly income under $150, liquid resources under $100, " +
              "or combined income and resources less than monthly rent plus utilities.",
          ],
          commonPitfalls: [
            "Missing the interview appointment without rescheduling — this causes application denial.",
            "Not listing all household members — SNAP is a household benefit, not individual.",
          ],
        },
        {
          id: "us-step-snap-3",
          order: 3,
          title: "Telephone or In-Person Interview with Caseworker",
          description:
            "A SNAP caseworker will contact you for a telephone interview (or you may request in-person). " +
            "The interview covers household composition, income, resources, expenses, and immigration status. " +
            "The interview typically takes 20–45 minutes.",
          location: "Phone (caseworker calls) or state SNAP office",
          tips: [
            "Be available at the phone number you provided — missed calls count as a missed interview.",
            "Take notes: ask for the caseworker's name, direct number, and case number.",
            "Telephone interpreters are available — request your language when scheduling.",
          ],
          commonPitfalls: [
            "Forgetting to report all household members — including non-applying members affects household income calculation.",
          ],
        },
        {
          id: "us-step-snap-4",
          order: 4,
          title: "Eligibility Determination and EBT Card Issuance",
          description:
            "The state agency has 30 days from application date to make a determination (7 days for expedited). " +
            "If approved, you receive an EBT card by mail within a few days. " +
            "Benefits are loaded on a monthly schedule. " +
            "If denied, you receive a written notice stating the reason and your right to appeal.",
          location: "EBT card mailed to address on file",
          tips: [
            "Activate your EBT card immediately — call the number on the card sticker.",
            "PIN selection: use a number you can remember but is not obvious (not birthday).",
          ],
          commonPitfalls: [
            "EBT card sent to wrong address — update your address immediately with the caseworker.",
          ],
        },
        {
          id: "us-step-snap-5",
          order: 5,
          title: "SNAP Fair Hearing (If Denied or Benefits Reduced)",
          description:
            "If your SNAP application is denied, benefits reduced, or case closed, you have the right to " +
            "request a fair hearing within 90 days of the notice (some states allow 90–180 days). " +
            "If you request a hearing within 10 days of a reduction/closure notice, benefits continue " +
            "at the prior level until the hearing decision (aid-paid-pending). " +
            "Request a hearing in writing to your state SNAP office.",
          location: "State administrative hearing office (in-person or phone)",
          documents: [
            "Original denial/reduction notice",
            "Any evidence supporting your eligibility (income records, medical documentation)",
          ],
          tips: [
            "Contact local legal aid immediately — they can represent you at the hearing for free.",
            "Request 'aid paid pending' in writing to maintain current benefit level during appeal.",
          ],
        },
      ],
    },

    {
      id: "us-process-ssi-application",
      programId: "us-program-ssi",
      name: "SSI Application Process (Disability-Based)",
      estimatedDuration: "3–6 months for initial decision; 1–3 years if appealed to ALJ hearing",
      cost: "Free; disability attorneys work on contingency (max 25% of back pay, capped at $7,200)",
      steps: [
        {
          id: "us-step-ssi-1",
          order: 1,
          title: "Initial Application with Social Security Administration",
          description:
            "Apply online at ssa.gov, by phone at 1-800-772-1213, or in person at a local SSA office. " +
            "Provide complete medical, work, and income history. " +
            "For disability claims, SSA will request your medical records from treating providers " +
            "or schedule a Consultative Examination (CE) with an SSA-selected doctor.",
          location:
            "ssa.gov (online), SSA office (1-800-772-1213 to schedule), or local SSA field office",
          documents: [
            "Social Security card",
            "Proof of age (birth certificate)",
            "Proof of citizenship or immigration status",
            "Medical records, names and addresses of all treating doctors, hospitals, clinics",
            "List of all medications",
            "Proof of income and resources (bank statements, asset valuations)",
          ],
          tips: [
            "Apply as soon as you believe you are disabled — the application date affects back pay.",
            "If you cannot complete the application, a family member or representative can assist.",
          ],
          applicationUrl: "https://www.ssa.gov/applyfordisability/",
        },
        {
          id: "us-step-ssi-2",
          order: 2,
          title: "SSA Sends Application to Disability Determination Services (DDS)",
          description:
            "SSA forwards the disability portion to the state Disability Determination Services (DDS) " +
            "agency for medical evaluation. DDS doctors and disability specialists review your medical " +
            "records and apply SSA's five-step sequential evaluation process. " +
            "DDS may schedule a Consultative Examination (CE) if records are insufficient.",
          location:
            "State Disability Determination Services (DDS) — no action required from applicant",
          tips: [
            "Continue treatment and keep all appointments during this period — gaps in treatment hurt claims.",
            "Respond promptly to any requests from DDS for additional records.",
          ],
          commonPitfalls: [
            "Missing CE appointments — this results in denial based on insufficient evidence.",
            "Not providing complete list of all treating providers — DDS can only request records you identify.",
          ],
        },
        {
          id: "us-step-ssi-3",
          order: 3,
          title: "Initial Determination Notice — Approve or Deny",
          description:
            "DDS returns a decision to SSA, which sends you a written notice. " +
            "Approval: SSA calculates your benefit amount and begins payments. " +
            "Denial: you receive a detailed denial letter explaining the reason and your appeal rights.",
          location: "Written notice mailed to address on file",
          tips: [
            "Do NOT give up after a first denial — approximately 65% of initial claims are denied; " +
              "many are approved on appeal.",
          ],
        },
        {
          id: "us-step-ssi-4",
          order: 4,
          title: "Request Reconsideration (First Appeal, if Denied)",
          description:
            "If denied, file a Request for Reconsideration (Form SSA-561) within 60 days of the denial notice. " +
            "A different DDS examiner reviews the case plus any new evidence you submit. " +
            "Approval rate at reconsideration: ~14%. Most claimants who persist proceed to ALJ hearing.",
          location: "Online at ssa.gov or in person at SSA office",
          documents: [
            "Denial notice",
            "Form SSA-561 (Request for Reconsideration)",
            "Any new medical records, treatment notes, or function reports",
          ],
          tips: [
            "Submit any new medical evidence — updated treatment notes, specialist evaluations, functional capacity assessments.",
          ],
          commonPitfalls: [
            "Missing the 60-day appeal deadline — late appeals require good cause showing.",
          ],
        },
        {
          id: "us-step-ssi-5",
          order: 5,
          title: "ALJ Hearing (Second Appeal — Most Favorable Stage)",
          description:
            "If reconsideration is denied, request a hearing before an Administrative Law Judge (ALJ) " +
            "within 60 days. ALJ hearings are in-person or by video. " +
            "You can submit new evidence, call witnesses, and have an attorney represent you. " +
            "Approval rate at ALJ hearing: ~50–55%. This is statistically the most successful appeal stage.",
          location: "SSA Office of Hearings Operations (OHO) — in-person or video hearing",
          documents: [
            "All prior SSA correspondence and denial notices",
            "Updated comprehensive medical records",
            "Functional capacity evaluation from treating physician",
            "Statement from employer or vocational expert if relevant",
          ],
          tips: [
            "Obtain legal representation — disability attorneys work on contingency and significantly improve outcomes.",
            "Request a copy of your complete SSA file (no charge) before the hearing to review DDS findings.",
            "The ALJ hearing is your opportunity to testify about how your condition affects your daily functioning.",
          ],
          commonPitfalls: [
            "Appearing at ALJ hearing without legal representation significantly reduces success rates.",
            "Not submitting updated medical records before the 5-day pre-hearing deadline.",
          ],
        },
      ],
    },

    {
      id: "us-process-section8-waitlist",
      programId: "us-program-section8",
      name: "Section 8 HCV Waitlist Application and Voucher Issuance",
      estimatedDuration: "2–10+ years on waitlist; 60–120 days to lease once voucher issued",
      cost: "Free to apply; tenant pays approximately 30% of adjusted monthly income toward rent",
      steps: [
        {
          id: "us-step-s8-1",
          order: 1,
          title: "Find an Open PHA Waitlist and Apply",
          description:
            "Most Public Housing Authorities (PHAs) have closed waitlists. Monitor HUD's PHA directory and " +
            "local PHA websites for waitlist openings — these are often open for only days or weeks before closing. " +
            "Apply to multiple PHAs simultaneously (allowed), including PHAs in adjacent jurisdictions. " +
            "Section 8 waitlists are generally 3–8 years long in most major cities.",
          location: "Local PHA office or online PHA portal",
          documents: ["Photo ID", "SSNs for all household members", "Proof of current residency"],
          tips: [
            "Sign up for HUD and local PHA email alerts for waitlist openings.",
            "Apply to suburban or less-populated county PHAs — wait times are often shorter.",
            "Some PHAs have preference categories (veterans, homeless, disabled) that move you up the list — declare any applicable preference.",
          ],
          applicationUrl: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts",
        },
        {
          id: "us-step-s8-2",
          order: 2,
          title: "Maintain Waitlist Position — Update Address and Respond to PHA",
          description:
            "While on the waitlist, you must keep your contact information current with the PHA and " +
            "respond to all correspondence within the specified deadline (often 10–14 days). " +
            "Failure to respond causes removal from the waitlist. " +
            "Some PHAs require annual or biannual waitlist updates to confirm continued interest.",
          location: "PHA office or online portal",
          tips: [
            "Update your address every time you move — PHA uses the address on file for all correspondence.",
            "Keep a copy of all communications with the PHA.",
          ],
          commonPitfalls: [
            "Moving without updating address — PHA notices returned undeliverable result in waitlist removal.",
            "Missing update deadlines — some PHAs purge the list with no second notice.",
          ],
        },
        {
          id: "us-step-s8-3",
          order: 3,
          title: "PHA Eligibility Determination Interview and Verification",
          description:
            "When your name reaches the top of the waitlist, the PHA schedules an eligibility interview " +
            "to verify current income, household composition, and pass criminal background checks. " +
            "Bring all required documents. The PHA will verify employment and income with employers and SSA.",
          location: "PHA office (in-person, required)",
          documents: [
            "Photo ID for all adults",
            "Birth certificates for all household members",
            "Social Security cards for all household members",
            "Proof of income (pay stubs, award letters, child support)",
            "Immigration documents for non-citizens",
          ],
          tips: [
            "Disclose all household members — undisclosed members can result in termination of assistance.",
            "Report any criminal history accurately — PHAs vary in disqualifying offenses and lookback periods.",
          ],
        },
        {
          id: "us-step-s8-4",
          order: 4,
          title: "Voucher Issued — Find a Qualifying Unit",
          description:
            "Once approved, you receive a Housing Choice Voucher with an expiration date (typically 60–120 days; " +
            "extensions available). You must find a private rental unit where: " +
            "(1) the landlord agrees to participate in Section 8; " +
            "(2) the rent does not exceed the PHA's Payment Standard; " +
            "(3) the unit passes a Housing Quality Standards (HQS) inspection. " +
            "You can search HUD's landlord database or use Section 8 housing search sites.",
          location: "Private rental market within PHA jurisdiction (or outside via portability)",
          tips: [
            "Start housing search immediately — 60 days goes quickly; request a 60-day extension if needed.",
            "Contact landlords directly and show them the voucher — some are unfamiliar with Section 8.",
            "Check goSection8.com or AffordableHousing.com for Section 8 accepting landlords.",
            "In tight markets, consider 'porting' your voucher to a less competitive area.",
          ],
          commonPitfalls: [
            "Choosing a unit that fails HQS inspection — this delays occupancy and uses up your voucher time.",
            "Signing a lease before HQS inspection approval — never sign before PHA authorises the unit.",
          ],
        },
        {
          id: "us-step-s8-5",
          order: 5,
          title: "HQS Inspection and Housing Assistance Payments (HAP) Contract",
          description:
            "Once you find a willing landlord, the PHA schedules a Housing Quality Standards (HQS) inspection. " +
            "If the unit passes, the PHA and landlord sign a Housing Assistance Payments (HAP) Contract. " +
            "You and the landlord sign a lease. The PHA pays the subsidy portion directly to the landlord each month.",
          location: "Rental unit and PHA office",
          documents: ["Signed lease with landlord", "Landlord's W-9 form (for PHA payments)"],
          tips: [
            "Review the lease carefully — you are bound by its terms in addition to HCV rules.",
            "Annual HQS inspections are required — maintain the unit in good condition.",
          ],
        },
      ],
    },
  ],

  // -------------------------------------------------------------------------
  // Institutions
  // -------------------------------------------------------------------------
  institutions: [
    {
      id: "us-inst-ssa",
      name: "Social Security Administration (SSA)",
      type: "federal-agency",
      jurisdiction: "US",
      phone: "1-800-772-1213 (TTY: 1-800-325-0778)",
      website: "https://www.ssa.gov",
      hours: "Mon–Fri 08:00–19:00 ET (phone); local office hours vary",
      waitTime: "Phone: 20–60 minutes; in-person: 1–4 hours; appointment recommended",
    },
    {
      id: "us-inst-dss",
      name: "State Department of Social Services (DSS/DHS)",
      type: "state-office",
      jurisdiction: "US",
      website: "https://www.benefits.gov/benefit/361",
      hours: "Varies by state — typically Mon–Fri 08:00–17:00",
      waitTime: "In-person walk-in: 1–6 hours; phone: 30–90 minutes; online typically fastest",
    },
    {
      id: "us-inst-pha",
      name: "Public Housing Authority (PHA)",
      type: "local-government",
      jurisdiction: "US",
      website: "https://www.hud.gov/program_offices/public_indian_housing/pha/contacts",
      hours: "Varies by jurisdiction — typically Mon–Fri 08:00–17:00",
      waitTime: "Phone and walk-in: 30 minutes–4 hours; Section 8 waitlist: years",
    },
    {
      id: "us-inst-legal-aid",
      name: "Legal Aid (State/Local Legal Services Organizations)",
      type: "ngo",
      jurisdiction: "US",
      phone: "1-888-346-5592 (LawHelp.org referral line)",
      website: "https://www.lawhelp.org",
      hours: "Typically Mon–Fri 09:00–17:00",
      waitTime: "Initial intake: same day to 2 weeks; full representation: varies by capacity",
    },
    {
      id: "us-inst-irs-vita",
      name: "IRS VITA (Volunteer Income Tax Assistance)",
      type: "federal-agency",
      jurisdiction: "US",
      phone: "1-800-906-9887",
      website: "https://www.irs.gov/vita",
      hours: "January–April 15 (tax season); hours vary by site",
      waitTime: "Walk-in during tax season: 30 minutes–3 hours; appointments available",
    },
    {
      id: "us-inst-wic-clinic",
      name: "WIC Local Agency / Clinic",
      type: "state-office",
      jurisdiction: "US",
      phone: "1-800-942-3678 (USDA FNS WIC hotline)",
      website: "https://www.fns.usda.gov/wic/wic-local-agency-contacts",
      hours: "Varies by clinic — typically Mon–Fri 08:00–17:00; some Saturday hours",
      waitTime: "Appointment: typically within 1–2 weeks",
    },
  ],

  // -------------------------------------------------------------------------
  // Rights
  // -------------------------------------------------------------------------
  rights: [
    {
      id: "us-right-snap-fair-hearing",
      title: "Right to a SNAP Fair Hearing",
      description:
        "Any SNAP applicant or recipient whose application is denied, whose benefits are reduced or " +
        "terminated, or who disagrees with a caseworker decision has the right to request a fair hearing " +
        "before a state administrative law judge. Benefits continue at the prior level during the hearing " +
        "(aid-paid-pending) if the hearing is requested within 10 days of the adverse action notice.",
      domain: "nutrition",
      legalBasis:
        "Food and Nutrition Act of 2008 (7 U.S.C. § 2020(e)(10)); SNAP regulations 7 CFR § 273.15; " +
        "Goldberg v. Kelly, 397 U.S. 254 (1970) (constitutional due process for benefit terminations)",
      appealDeadline:
        "90 days from adverse action notice (some states up to 180 days); 10 days for aid-paid-pending",
    },
    {
      id: "us-right-medicaid-fair-hearing",
      title: "Right to Medicaid Appeal and Fair Hearing",
      description:
        "Medicaid applicants and enrollees have the right to appeal any denial, reduction, suspension, " +
        "or termination of Medicaid coverage or specific services. " +
        "A fair hearing must be held and decided within 90 days of the hearing request.",
      domain: "health",
      legalBasis:
        "Social Security Act § 1902(a)(3); Medicaid regulations 42 CFR § 431.200 et seq.; " +
        "State fair hearing procedures",
      appealDeadline: "90 days from adverse notice; 10 days for aid-paid-pending in most states",
    },
    {
      id: "us-right-ssi-appeal",
      title: "Right to Appeal SSI/Disability Decisions",
      description:
        "Every SSI applicant has a four-level administrative appeal process: Reconsideration, " +
        "Administrative Law Judge (ALJ) Hearing, Appeals Council Review, and Federal Court. " +
        "The right to representation by an attorney or non-attorney representative is protected. " +
        "Disability attorneys may not charge upfront fees — fees are contingency-based.",
      domain: "social-protection",
      legalBasis:
        "Social Security Act § 205(b) and § 1631; SSA regulations 20 CFR § 416.1400 et seq.; " +
        "Mathews v. Eldridge, 424 U.S. 319 (1976)",
      appealDeadline: "60 days from each level's decision (plus 5-day mail presumption)",
    },
    {
      id: "us-right-housing-discrimination",
      title: "Right to Freedom from Housing Discrimination",
      description:
        "Federal Fair Housing Act prohibits discrimination in rental, sale, and financing of housing " +
        "based on race, color, national origin, religion, sex, disability, or familial status. " +
        "Section 8 voucher holders have additional protections in many states and cities " +
        "against source-of-income discrimination.",
      domain: "housing",
      legalBasis:
        "Fair Housing Act of 1968 (42 U.S.C. § 3601 et seq.); Americans with Disabilities Act (ADA); " +
        "Section 504 of the Rehabilitation Act; State and local fair housing laws",
      appealDeadline:
        "File HUD complaint within 1 year of discriminatory act; civil action within 2 years",
    },
    {
      id: "us-right-due-process-benefits",
      title: "Due Process Rights in Public Benefits",
      description:
        "Government cannot terminate existing public benefits (SNAP, Medicaid, SSI, Section 8) " +
        "without advance written notice stating the reason and the right to appeal before termination. " +
        "Beneficiaries have the constitutional right to continue receiving benefits while a timely appeal is pending.",
      domain: "legal",
      legalBasis:
        "Fifth and Fourteenth Amendments (Due Process Clause); " +
        "Goldberg v. Kelly, 397 U.S. 254 (1970); " +
        "Mathews v. Eldridge, 424 U.S. 319 (1976)",
    },
  ],
};
