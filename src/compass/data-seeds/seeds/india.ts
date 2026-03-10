/**
 * COMPASS Seed Data — India (Republic of India)
 *
 * Focus domain: Social protection
 * Key programs: PM-KISAN, MGNREGA, Ayushman Bharat (PM-JAY), PM Awas Yojana, PDS
 * Key institutions: Gram Panchayat, BDO, PFMS, district collector offices
 *
 * Data reflects the Union and state programme rules as of early 2026.
 * State-level additions (e.g. Ration card for PDS) are noted where they diverge.
 * All amounts in Indian Rupees (INR).
 */

import type { CountrySeed } from "../types.js";

export const indiaSeed: CountrySeed = {
  jurisdiction: {
    id: "jurisdiction-in",
    name: "Republic of India",
    code: "IN",
    languages: ["hi", "en", "bn", "te", "mr", "ta", "ur", "gu", "kn", "ml"],
    currency: "INR",
    governmentType: "Federal parliamentary constitutional republic",
  },

  // -------------------------------------------------------------------------
  // Programs
  // -------------------------------------------------------------------------
  programs: [
    {
      id: "in-program-pmkisan",
      name: "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
      description:
        "Direct income support scheme providing INR 6,000 per year (in three equal instalments of INR 2,000) " +
        "to all small and marginal farmer families across India. " +
        "Benefits are transferred directly to Aadhaar-linked bank accounts via PFMS (Public Financial Management System). " +
        "Launched in February 2019 under the Ministry of Agriculture and Farmers' Welfare.",
      jurisdiction: "IN",
      domain: "agriculture",
      benefits:
        "INR 6,000 per year disbursed in three instalments of INR 2,000 each " +
        "(April–July, August–November, December–March) directly to bank account.",
      eligibilityCriteria: [
        {
          field: "location.countryCode",
          operator: "eq",
          value: "IN",
          description: "Must be a resident Indian farmer family",
        },
        {
          field: "custom:in.landOwnership",
          operator: "eq",
          value: true,
          description: "Must own cultivable land (in their own name or joint family name)",
        },
        {
          field: "custom:in.aadhaarLinked",
          operator: "eq",
          value: true,
          description: "Bank account must be seeded (linked) with Aadhaar",
        },
        {
          field: "custom:in.institutionalLandHolder",
          operator: "eq",
          value: false,
          description:
            "Institutional land holders (temples, trusts, companies) are excluded; individual farm families only",
        },
        {
          field: "custom:in.governmentEmployee",
          operator: "eq",
          value: false,
          description:
            "Current or retired government employees (Group A/B) and income tax payers are excluded",
        },
      ],
      requiredDocuments: [
        "Aadhaar card",
        "Land ownership records (Khasra/Khatauni, ROR — Record of Rights)",
        "Bank passbook showing Aadhaar-linked account with IFSC code",
        "Mobile number (for OTP-based Aadhaar e-KYC)",
        "Caste certificate (for SC/ST land classification records, if applicable)",
      ],
      applicationUrl: "https://pmkisan.gov.in",
      deadline: "2026-03-31",
    },

    {
      id: "in-program-mgnrega",
      name: "MGNREGA (Mahatma Gandhi National Rural Employment Guarantee Act)",
      description:
        "Legal guarantee of 100 days of unskilled manual wage employment per financial year to every " +
        "rural household whose adult members are willing to do unskilled manual work. " +
        "Wages are paid directly to bank/post office accounts within 15 days of work completion. " +
        "The scheme also creates durable community assets (roads, ponds, wells).",
      jurisdiction: "IN",
      domain: "employment",
      benefits:
        "Guaranteed 100 days of employment per household per year at the statutory minimum wage " +
        "(central government notified rate, currently INR 245–374/day depending on state); " +
        "unemployment allowance if work is not provided within 15 days of demand; " +
        "worksite facilities (crèche, drinking water, shade, first aid).",
      eligibilityCriteria: [
        {
          field: "location.countryCode",
          operator: "eq",
          value: "IN",
          description: "Must be resident in a rural area (as defined by the Census)",
        },
        {
          field: "custom:in.residenceType",
          operator: "eq",
          value: "rural",
          description: "Must reside in a rural area — urban residents are not eligible",
        },
        {
          field: "age",
          operator: "gte",
          value: 18,
          description: "Must be 18 years of age or older",
        },
        {
          field: "custom:in.jobCardHolder",
          operator: "eq",
          value: true,
          description: "Must possess a valid MGNREGA Job Card (obtained from Gram Panchayat)",
        },
        {
          field: "custom:in.willingUnkilledWork",
          operator: "eq",
          value: true,
          description: "Must be willing to do unskilled manual labour",
        },
      ],
      requiredDocuments: [
        "Aadhaar card",
        "MGNREGA Job Card (issued by Gram Panchayat)",
        "Bank or post office account passbook (for wage payments)",
        "Photograph (for Job Card application)",
      ],
      applicationUrl: "https://nrega.nic.in",
    },

    {
      id: "in-program-ayushman-bharat",
      name: "Ayushman Bharat PM-JAY (Pradhan Mantri Jan Arogya Yojana)",
      description:
        "World's largest government-funded health insurance scheme providing health cover of INR 5 lakh " +
        "per family per year for secondary and tertiary hospitalisation. " +
        "Covers 1,949 procedures across 27 medical specialties at empanelled government and private hospitals. " +
        "Cashless and paperless treatment at any empanelled hospital nationwide.",
      jurisdiction: "IN",
      domain: "health",
      benefits:
        "Health insurance cover of INR 5,00,000 per family per year; " +
        "cashless treatment at 29,000+ empanelled hospitals across India; " +
        "pre- and post-hospitalisation expenses covered (3 days pre / 15 days post); " +
        "transport allowance included.",
      eligibilityCriteria: [
        {
          field: "location.countryCode",
          operator: "eq",
          value: "IN",
          description: "Must be a resident Indian family",
        },
        {
          field: "custom:in.sebhCategory",
          operator: "in",
          value: ["deprivedRural", "occupationalUrban", "activeSNAPBeneficiary"],
          description:
            "Family must belong to SECC 2011 deprived rural categories or listed occupational urban categories, " +
            "or be an active RSBY beneficiary",
        },
        {
          field: "custom:in.aadhaarLinked",
          operator: "eq",
          value: true,
          description: "Aadhaar must be linked for eKYC identification at hospital",
        },
      ],
      requiredDocuments: [
        "Aadhaar card or Ration Card (for beneficiary identification)",
        "PM-JAY e-card (downloaded from pmjay.gov.in or obtained at Common Service Centre)",
        "SECC/RSBY beneficiary ID (if available)",
      ],
      applicationUrl: "https://pmjay.gov.in",
    },

    {
      id: "in-program-pm-awas-yojana",
      name: "PM Awas Yojana — Gramin (PMAY-G) — Rural Housing",
      description:
        "Central government scheme providing financial assistance to Below Poverty Line (BPL) rural " +
        "families for construction of a pucca (permanent) house. " +
        "Assistance amount: INR 1.20 lakh in plains and INR 1.30 lakh in hilly/difficult terrain. " +
        "Benefits are released in instalments directly to Aadhaar-linked bank accounts upon geo-tagged " +
        "photo verification of construction stages.",
      jurisdiction: "IN",
      domain: "housing",
      benefits:
        "INR 1,20,000 (plains) or INR 1,30,000 (hilly terrain) construction assistance in 3 instalments; " +
        "90 days MGNREGA labour (unskilled component) for beneficiary; " +
        "toilet under Swachh Bharat Mission (SBM) at INR 12,000 additional.",
      eligibilityCriteria: [
        {
          field: "location.countryCode",
          operator: "eq",
          value: "IN",
          description: "Must be resident in rural India",
        },
        {
          field: "custom:in.residenceType",
          operator: "eq",
          value: "rural",
          description: "Programme applies only to rural areas (separate PMAY-Urban for urban)",
        },
        {
          field: "custom:in.puckaHouse",
          operator: "eq",
          value: false,
          description: "Must not already own a pucca (permanent) house",
        },
        {
          field: "custom:in.secc2011Listed",
          operator: "eq",
          value: true,
          description:
            "Household must be listed in SECC 2011 (Socio-Economic Caste Census) as houseless or in kutcha house",
        },
        {
          field: "custom:in.aadhaarLinked",
          operator: "eq",
          value: true,
          description: "Bank account must be Aadhaar-seeded for direct benefit transfer",
        },
      ],
      requiredDocuments: [
        "Aadhaar card (mandatory for all adult family members)",
        "Bank account passbook with Aadhaar seeding proof",
        "SECC 2011 inclusion printout from AwaasSoft / Gram Panchayat",
        "Land ownership or land-use rights document (if constructing on own land)",
        "Job Card (for MGNREGA labour days)",
        "Caste/tribe certificate (if applicable for priority categories)",
      ],
      applicationUrl: "https://pmayg.nic.in",
    },

    {
      id: "in-program-pds",
      name: "Public Distribution System (PDS) / Ration Card",
      description:
        "Subsidised food grain distribution system operating through a network of Fair Price Shops (FPS) " +
        "under the National Food Security Act, 2013 (NFSA). " +
        "Priority Household (PHH) beneficiaries receive 5 kg of food grain per person per month " +
        "at highly subsidised rates (rice/wheat at INR 1–3/kg). " +
        "Antyodaya Anna Yojana (AAY) — poorest of the poor — receives 35 kg per household per month.",
      jurisdiction: "IN",
      domain: "nutrition",
      benefits:
        "PHH category: 5 kg food grain per person/month at INR 1 (wheat) / INR 2 (rice) / INR 1 (coarse grain); " +
        "AAY category: 35 kg per household/month at same rates; " +
        "Pradhan Mantri Garib Kalyan Anna Yojana (PMGKAY) provides additional free grain during crises.",
      eligibilityCriteria: [
        {
          field: "location.countryCode",
          operator: "eq",
          value: "IN",
          description: "Must be an Indian resident household",
        },
        {
          field: "custom:in.rationCardStatus",
          operator: "in",
          value: ["PHH", "AAY", "applied"],
          description:
            "Household must hold or be applying for a Priority Household (PHH) or Antyodaya (AAY) ration card",
        },
        {
          field: "incomeAnnualCents",
          operator: "lte",
          value: 18000000,
          description:
            "Annual household income must be below state-defined poverty threshold (approx. INR 1.8 lakh/year in most states)",
        },
      ],
      requiredDocuments: [
        "Aadhaar card for all family members",
        "Proof of residence (electricity bill, rental agreement, voter ID)",
        "Income certificate from Tehsil/Revenue office",
        "Caste certificate (for SC/ST priority — state-specific)",
        "Existing ration card (if surrendering/transferring)",
        "Passport-size photographs of head of household",
      ],
      applicationUrl: "https://nfsa.gov.in",
    },
  ],

  // -------------------------------------------------------------------------
  // Processes
  // -------------------------------------------------------------------------
  processes: [
    {
      id: "in-process-pmkisan-registration",
      programId: "in-program-pmkisan",
      name: "PM-KISAN Farmer Registration and Aadhaar eKYC",
      estimatedDuration: "7–30 days (eKYC and verification)",
      cost: "Free",
      steps: [
        {
          id: "in-step-pmkisan-1",
          order: 1,
          title: "Verify Land Records at Patwari / Revenue Office",
          description:
            "Visit your local Patwari (Revenue Inspector) or Tehsil office to obtain an up-to-date " +
            "Khasra/Khatauni (Record of Rights) confirming that cultivable land is registered in your name " +
            "or joint family name. The land record must match the name on your Aadhaar card.",
          location: "Tehsil / Patwari office or village revenue office",
          documents: ["Aadhaar card", "Previous land records or passbook"],
          tips: [
            "In many states you can view land records online via Bhulekh portals (e.g. UP Bhulekh, Maharashtra Bhunaksha).",
            "If your name differs between Aadhaar and land records (spelling variation, married name change), get a corrective endorsement first.",
          ],
          commonPitfalls: [
            "Name mismatch between Aadhaar and land records is the single largest cause of PM-KISAN application failure.",
          ],
        },
        {
          id: "in-step-pmkisan-2",
          order: 2,
          title: "Aadhaar–Bank Account Seeding (eKYC)",
          description:
            "Ensure your bank account (any nationalised or scheduled bank, or Post Office) is linked " +
            "with your Aadhaar number. This is called 'Aadhaar seeding'. " +
            "Visit your bank branch or use the bank's online portal/app to complete the seeding. " +
            "The PM-KISAN portal will only transfer funds to an Aadhaar-seeded account.",
          location: "Bank branch, Common Service Centre (CSC), or bank mobile app",
          documents: ["Aadhaar card (original and copy)", "Bank passbook"],
          tips: [
            "CSC (Jan Seva Kendra) operators can complete Aadhaar seeding at the village level for a nominal service fee.",
            "Verify seeding status at uidai.gov.in → 'Check Aadhaar and Bank Linking Status'.",
          ],
        },
        {
          id: "in-step-pmkisan-3",
          order: 3,
          title: "Self-Register on PM-KISAN Portal or Apply via Gram Panchayat / CSC",
          description:
            "Farmers can self-register at pmkisan.gov.in using their Aadhaar number and mobile number linked to Aadhaar. " +
            "Alternatively, visit your Gram Panchayat office or Common Service Centre (CSC) for assisted registration. " +
            "Enter all details: name, Aadhaar number, bank account number, IFSC, land area, and Khasra number.",
          location: "pmkisan.gov.in (online) or Gram Panchayat / CSC (in-person)",
          documents: [
            "Aadhaar card",
            "Bank passbook (account number + IFSC code)",
            "Khasra/Khatauni (land records)",
          ],
          applicationUrl: "https://pmkisan.gov.in/FarmerRegistration.aspx",
          tips: [
            "The mobile number entered must be the one registered with Aadhaar — OTP verification is mandatory.",
            "CSC operators charge a nominal fee (INR 30–50) but handle the process end-to-end.",
          ],
          commonPitfalls: [
            "Entering incorrect IFSC code causes payment failure — double-check on the bank passbook.",
            "Registering under another household member's name when land is in the applicant's own name.",
          ],
        },
        {
          id: "in-step-pmkisan-4",
          order: 4,
          title: "State/District Verification",
          description:
            "After self-registration, the application is forwarded to the District Agriculture Officer " +
            "for field verification of land records. Approved applications are pushed to PFMS for " +
            "Direct Benefit Transfer (DBT). You can check status on the PM-KISAN portal.",
          location: "Automatic (district-level backend verification)",
          tips: [
            "Check beneficiary status at pmkisan.gov.in → 'Beneficiary Status' using Aadhaar or bank account number.",
            "If rejected, visit the District Agriculture Office with original land records to resolve discrepancies.",
          ],
        },
        {
          id: "in-step-pmkisan-5",
          order: 5,
          title: "Complete Mandatory eKYC on PM-KISAN Portal",
          description:
            "All registered beneficiaries must complete eKYC (OTP-based or biometric) on the PM-KISAN " +
            "portal to continue receiving instalments. Failure to complete eKYC leads to suspension of " +
            "future payments. eKYC can be done online via OTP or at CSC/UIDAI centres via biometric.",
          location: "pmkisan.gov.in or CSC / Bank branch",
          documents: [
            "Aadhaar-linked mobile number (for OTP eKYC)",
            "Aadhaar fingerprint/iris (for biometric eKYC at CSC)",
          ],
          applicationUrl: "https://pmkisan.gov.in/eKYC.aspx",
          tips: [
            "eKYC must be renewed periodically — check SMS alerts from the portal for deadline reminders.",
          ],
        },
      ],
    },

    {
      id: "in-process-mgnrega-job-card",
      programId: "in-program-mgnrega",
      name: "MGNREGA Job Card Application and Work Demand",
      estimatedDuration: "5–15 days for Job Card; work must be provided within 15 days of demand",
      cost: "Free",
      steps: [
        {
          id: "in-step-mgnrega-1",
          order: 1,
          title: "Apply for MGNREGA Job Card at Gram Panchayat",
          description:
            "Visit your Gram Panchayat (GP) office and submit a written application for a Job Card. " +
            "Include names of all adult willing-to-work members of the household. " +
            "The GP must issue the Job Card within 15 days of application — it is a statutory right.",
          location: "Gram Panchayat office",
          documents: [
            "Aadhaar card (all adult family members)",
            "Passport-size photographs (all members to appear on Job Card)",
            "Bank/post office account details",
            "Proof of residence in village",
          ],
          tips: [
            "The Gram Panchayat cannot refuse or charge a fee for issuing a Job Card — report any refusal to the Block Development Officer (BDO).",
            "The Job Card is your legal entitlement document — keep it safe.",
          ],
          commonPitfalls: [
            "Not enrolling all working-age adults in the household — each registered adult counts toward the 100-day entitlement.",
          ],
        },
        {
          id: "in-step-mgnrega-2",
          order: 2,
          title: "Submit Written Work Demand to Gram Panchayat",
          description:
            "When you need work, submit a written application (work demand) to the Gram Panchayat or " +
            "directly to the Programme Officer. The dated receipt of the demand is crucial — " +
            "it triggers the 15-day statutory clock for providing work.",
          location: "Gram Panchayat office",
          documents: [
            "Job Card",
            "Written work demand application (GP provides template; plain paper also accepted)",
          ],
          tips: [
            "Always get a dated acknowledgement — take a photograph of the submission if possible.",
            "Demands can be submitted at any time of year — work is typically offered for 6–8 weeks at a time.",
          ],
          commonPitfalls: [
            "Verbal requests are not legally binding — the demand must be in writing with acknowledgement.",
          ],
        },
        {
          id: "in-step-mgnrega-3",
          order: 3,
          title: "Work Allocation and Attendance on Worksite",
          description:
            "You will be allocated to a public work project (road construction, pond desilting, tree planting, etc.) " +
            "within 5 km of your residence (if worksite is beyond 5 km, 10% extra wages apply). " +
            "Attendance is recorded in a muster roll maintained by the Gram Rozgar Sahayak. " +
            "Worksites must have shade, clean drinking water, crèche for children under 5, and first aid.",
          location: "Worksite within or near home village",
          documents: ["Job Card (to be shown on worksite)"],
          tips: [
            "Wage measurement is based on piece rate or time rate — understand the task norm before starting.",
            "If work is not provided within 15 days, you are entitled to an unemployment allowance — apply in writing to the GP.",
          ],
        },
        {
          id: "in-step-mgnrega-4",
          order: 4,
          title: "Wage Payment via Bank/Post Office Account",
          description:
            "Wages must be credited to your bank or post office account within 15 days of work completion. " +
            "The electronic muster roll (e-MR) data flows through NREGASoft to PFMS for payment. " +
            "Check your account and MGNREGA passbook for credit.",
          location: "Bank branch or Post Office",
          tips: [
            "If wages are delayed beyond 15 days, you are entitled to a delay compensation at 0.05% per day — file complaint with Programme Officer.",
            "View your payment status at nrega.nic.in using Job Card number.",
          ],
          commonPitfalls: [
            "Inactive or incorrect bank account numbers cause payment failures — verify at the GP or bank before demanding work.",
          ],
        },
      ],
    },

    {
      id: "in-process-ayushman-card",
      programId: "in-program-ayushman-bharat",
      name: "Ayushman Bharat PM-JAY Beneficiary Card Application",
      estimatedDuration:
        "1–3 days (card issuance); treatment is cashless and immediate at empanelled hospitals",
      cost: "Free",
      steps: [
        {
          id: "in-step-pmjay-1",
          order: 1,
          title: "Check Eligibility on PM-JAY Website",
          description:
            "Visit pmjay.gov.in and check whether your household is a PM-JAY beneficiary " +
            "using your mobile number or Ration Card number. The SECC 2011 database is the primary eligibility list. " +
            "If your name appears, proceed to get your Ayushman card.",
          location: "pmjay.gov.in (online) or nearest CSC / empanelled hospital",
          documents: [],
          applicationUrl: "https://pmjay.gov.in/are-you-eligible",
          tips: [
            "Also check at your nearest Common Service Centre (Jan Seva Kendra) if you don't have internet access.",
          ],
        },
        {
          id: "in-step-pmjay-2",
          order: 2,
          title: "Obtain Ayushman Card at CSC, Hospital, or Jan Arogya Mitra",
          description:
            "Visit any empanelled hospital's Ayushman Mitra desk or a Common Service Centre to get " +
            "your Ayushman card issued. Biometric authentication via Aadhaar (fingerprint) is used to confirm identity. " +
            "The card is issued on the spot and is valid for the entire family.",
          location:
            "Common Service Centre (CSC), empanelled hospital Ayushman Mitra desk, or health camp",
          documents: [
            "Aadhaar card (mandatory for eKYC)",
            "Ration Card or other proof linking to SECC beneficiary household",
            "Mobile number linked to Aadhaar (for OTP)",
          ],
          tips: [
            "List all eligible family members when getting the card — each member gets their own QR code on the family card.",
            "If biometric authentication fails due to worn fingerprints (common among manual labourers), OTP-based eKYC is available.",
          ],
          commonPitfalls: [
            "Not registering all family members — each member must complete eKYC for individual coverage.",
          ],
        },
        {
          id: "in-step-pmjay-3",
          order: 3,
          title: "Cashless Treatment at Empanelled Hospital",
          description:
            "When hospitalisation is required, show your Ayushman card at the Ayushman Mitra desk at " +
            "any empanelled government or private hospital nationwide. " +
            "The hospital verifies your identity via the PM-JAY portal and initiates pre-authorisation. " +
            "Treatment is completely cashless for covered procedures.",
          location: "Any empanelled hospital (find on pmjay.gov.in → Find Hospital)",
          documents: ["Ayushman card or Aadhaar card"],
          tips: [
            "All pre-authorised procedures are covered — request the list of covered packages (HBP 2.0) from the Ayushman Mitra.",
            "If the hospital refuses cashless treatment for a covered package, complain to the PM-JAY state helpline: 14555.",
          ],
          commonPitfalls: [
            "Using non-empanelled private hospitals — they cannot bill under PM-JAY.",
            "Pre-existing chronic conditions are covered, but confirm with Ayushman Mitra before elective procedures.",
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
      id: "in-inst-gram-panchayat",
      name: "Gram Panchayat (Village Council)",
      type: "local-government",
      jurisdiction: "IN",
      address: "Gram Panchayat Bhavan, village level (address varies)",
      hours: "Mon–Sat 10:00–17:00 (varies by state); Gram Sabha meetings periodically",
      waitTime: "Walk-in: same day to 1 week for certificates; Job Card: 15 days statutory",
    },
    {
      id: "in-inst-bdo",
      name: "Block Development Office (BDO / Panchayat Samiti)",
      type: "state-office",
      jurisdiction: "IN",
      address: "Block Development Office, block headquarters (varies by district)",
      hours: "Mon–Fri 10:00–17:00",
      waitTime: "Certificate processing: 1–2 weeks; complaint resolution: 30 days",
    },
    {
      id: "in-inst-district-collector",
      name: "District Collectorate / Collector and District Magistrate (DM)",
      type: "state-office",
      jurisdiction: "IN",
      address: "District Collectorate, district headquarters",
      hours: "Mon–Sat 10:00–17:00 (office); public hearings: scheduled",
      waitTime: "Public hearing (Jan Sunwai): monthly; appeal resolution: 30–90 days",
    },
    {
      id: "in-inst-csc",
      name: "Common Service Centre (CSC / Jan Seva Kendra)",
      type: "public-service-outlet",
      jurisdiction: "IN",
      phone: "1800-121-3468 (CSC helpline, toll-free)",
      website: "https://www.csc.gov.in",
      hours: "Typically Mon–Sat 09:00–19:00 (village-level CSCs)",
      waitTime: "Immediate to 30 minutes for most digital services",
    },
    {
      id: "in-inst-pfms",
      name: "Public Financial Management System (PFMS) / DBT Bharat",
      type: "federal-agency",
      jurisdiction: "IN",
      phone: "1800-118-111 (PFMS helpline)",
      website: "https://pfms.nic.in",
      hours: "Online portal 24/7; helpline Mon–Fri 09:00–18:00",
    },
    {
      id: "in-inst-nrega-helpline",
      name: "MGNREGA Grievance Redressal / MIS",
      type: "federal-agency",
      jurisdiction: "IN",
      phone: "1800-345-22-44 (MGNREGA helpline, toll-free)",
      website: "https://nrega.nic.in",
      hours: "Helpline Mon–Fri 09:00–18:00",
    },
  ],

  // -------------------------------------------------------------------------
  // Rights
  // -------------------------------------------------------------------------
  rights: [
    {
      id: "in-right-work",
      title: "Right to Work (MGNREGA Guarantee)",
      description:
        "Every rural household has a legal right to at least 100 days of unskilled manual employment " +
        "per financial year under MGNREGA. If work is not provided within 15 days of a written demand, " +
        "the applicant is entitled to an unemployment allowance. This is a justiciable right enforceable " +
        "in courts.",
      domain: "employment",
      legalBasis:
        "Mahatma Gandhi National Rural Employment Guarantee Act, 2005 (MGNREGA), Sections 3, 7, and 8; " +
        "Constitution of India, Article 41 (Directive Principle — right to work)",
      appealDeadline:
        "Complaint to Programme Officer within 7 days of denial; appeal to Grievance Redressal Officer within 30 days",
    },
    {
      id: "in-right-food",
      title: "Right to Food — Subsidised Food Grain Entitlement",
      description:
        "Every Priority Household (PHH) family has a legal entitlement to 5 kg of food grain per " +
        "person per month and every Antyodaya (AAY) household is entitled to 35 kg per month at " +
        "heavily subsidised rates under the National Food Security Act, 2013.",
      domain: "nutrition",
      legalBasis:
        "National Food Security Act, 2013 (NFSA), Sections 3 and 4; " +
        "Supreme Court of India orders in PUCL v. Union of India (2001–2012)",
      appealDeadline: "Complaint to District Grievance Redressal Officer within 30 days of denial",
    },
    {
      id: "in-right-housing",
      title: "Right to Housing Assistance for Homeless and Kutcha House Dwellers",
      description:
        "Houseless households and those living in kutcha (impermanent) houses listed in SECC 2011 have " +
        "a programme entitlement to housing assistance under PMAY-G. " +
        "The Supreme Court has interpreted the right to shelter as part of the right to life under Article 21.",
      domain: "housing",
      legalBasis:
        "Constitution of India, Article 21 (Right to Life); " +
        "PMAY-G Guidelines under Ministry of Rural Development; " +
        "Olga Tellis v. Bombay Municipal Corporation (1985 SC)",
    },
    {
      id: "in-right-grievance-redressal",
      title: "Right to Grievance Redressal under Social Schemes",
      description:
        "Any beneficiary denied, delayed, or deprived of entitlements under DBT schemes (PM-KISAN, MGNREGA, " +
        "PDS, PM-JAY, PMAY) has the right to file a grievance at the Gram Panchayat, Block, District, or " +
        "State level. Grievances must be acknowledged and resolved within 30 days.",
      domain: "legal",
      legalBasis:
        "Public Services Guarantee Acts (state-level); Right to Information Act, 2005; " +
        "MGNREGA Section 19 (Social Audit) and Section 27 (Grievance Redressal); " +
        "NFSA Section 14 (Grievance Redressal Mechanism)",
      appealDeadline:
        "30 days for Block/District resolution; further appeal to State Food Commission or Court",
    },
    {
      id: "in-right-social-audit",
      title: "Right to Social Audit and Information",
      description:
        "Under MGNREGA, all gram sabha meetings must include a social audit of works and expenditures. " +
        "Citizens have the right to inspect muster rolls, payment records, and work orders. " +
        "Under RTI Act, all public records of government schemes are accessible on request.",
      domain: "legal",
      legalBasis:
        "MGNREGA Section 17 (Social Audit); Right to Information Act, 2005, Section 3; " +
        "SECC 2011 data access norms",
      appealDeadline: "RTI response: 30 days from filing; CIC appeal within 90 days of refusal",
    },
  ],
};
