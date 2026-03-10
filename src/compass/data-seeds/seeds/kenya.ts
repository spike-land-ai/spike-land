/**
 * COMPASS Seed Data — Kenya (Republic of Kenya)
 *
 * Focus domain: Agricultural subsidies and social protection
 * Key programs: e-Subsidy Fertilizer, NHIF, KCIC Crop Insurance, Youth Enterprise Fund,
 *               Cash Transfer for Older Persons (CTOP)
 * Key institutions: AFA, NHIF, NG-CDF, KCSAP, county governments, Huduma Centres
 *
 * Data reflects national programme rules as of early 2026.
 * County-level implementation varies; M-Pesa integration is central to Kenya's
 * social protection delivery infrastructure (Safaricom dominates payments).
 * All amounts in Kenyan Shillings (KES).
 */

import type { CountrySeed } from "../types.js";

export const kenyaSeed: CountrySeed = {
  jurisdiction: {
    id: "jurisdiction-ke",
    name: "Republic of Kenya",
    code: "KE",
    languages: ["sw", "en"],
    currency: "KES",
    governmentType: "Presidential constitutional republic (devolved to 47 counties)",
  },

  // -------------------------------------------------------------------------
  // Programs
  // -------------------------------------------------------------------------
  programs: [
    {
      id: "ke-program-e-subsidy",
      name: "E-Subsidy Fertilizer Program (National Fertilizer Subsidy Programme — NFSP)",
      description:
        "Government subsidy programme administered by the Agriculture and Food Authority (AFA) providing " +
        "farmers with subsidised fertilizer (DAP and CAN) through a voucher/e-wallet system. " +
        "Farmers access the subsidy via a mobile-based redemption system linked to their national ID " +
        "and registered farm details. Subsidised price is typically 50–60% below open-market price.",
      jurisdiction: "KE",
      domain: "agriculture",
      benefits:
        "Subsidised DAP fertilizer at approximately KES 2,500/50kg bag (market price ~KES 5,500); " +
        "subsidised CAN at approximately KES 2,000/50kg bag; " +
        "each registered farmer entitled to 2 bags per season (additional bags subject to allocation).",
      eligibilityCriteria: [
        {
          field: "location.countryCode",
          operator: "eq",
          value: "KE",
          description: "Must be a Kenyan citizen farmer",
        },
        {
          field: "custom:ke.nationalIdRegistered",
          operator: "eq",
          value: true,
          description: "Must be registered with a valid Kenyan national ID (18+ years)",
        },
        {
          field: "custom:ke.registeredFarmer",
          operator: "eq",
          value: true,
          description: "Must be registered in the National Farmers Registry (NFR) managed by AFA",
        },
        {
          field: "custom:ke.farmSizeHectares",
          operator: "lte",
          value: 10,
          description: "Farm size must not exceed 10 hectares (targeting small and medium farmers)",
        },
        {
          field: "custom:ke.mobileMoneyAccount",
          operator: "eq",
          value: true,
          description:
            "Must have an active M-Pesa account registered in own name for subsidy disbursement",
        },
      ],
      requiredDocuments: [
        "National Identity Card (Kitambulisho cha Taifa)",
        "Active M-Pesa account (SIM must be in farmer's own name)",
        "Land ownership or tenancy evidence (title deed, lease agreement, or letter from chief/village elder)",
        "Farm registration certificate from AFA/KARI or ward agriculture officer endorsement",
      ],
      applicationUrl: "https://kilimo.go.ke",
      deadline: "2026-03-31",
    },

    {
      id: "ke-program-nhif",
      name: "NHIF (National Hospital Insurance Fund) — Now SHA",
      description:
        "Kenya's mandatory and voluntary national health insurance fund, renamed Social Health Authority (SHA) " +
        "in 2024 under the Social Health Insurance Act. Provides subsidised inpatient and outpatient health coverage " +
        "at accredited public and private facilities. " +
        "Informal sector and rural farmers enrol voluntarily at KES 500/month (SHA Community Scheme).",
      jurisdiction: "KE",
      domain: "health",
      benefits:
        "Inpatient coverage at government hospitals: fully subsidised; " +
        "outpatient coverage: available at contracted clinics; " +
        "maternal and child health services: free; " +
        "chronic disease management (dialysis, cancer, diabetes): covered under specific packages.",
      eligibilityCriteria: [
        {
          field: "location.countryCode",
          operator: "eq",
          value: "KE",
          description: "Must be a Kenyan citizen or legal resident",
        },
        {
          field: "age",
          operator: "gte",
          value: 18,
          description:
            "Principal member must be 18 years or older (children and spouse as dependants)",
        },
        {
          field: "custom:ke.nationalIdRegistered",
          operator: "eq",
          value: true,
          description: "Must have a valid Kenyan national ID or passport",
        },
        {
          field: "custom:ke.nssf_registered",
          operator: "eq",
          value: false,
          description:
            "For informal sector (SHA Community Scheme): not already covered by employer-based SHA/NHIF; " +
            "formal sector employees enrolled automatically",
        },
      ],
      requiredDocuments: [
        "National Identity Card or passport",
        "Passport-size photograph",
        "Completed SHA/NHIF registration form (Form NHIF/1A for self-employed/voluntary)",
        "M-Pesa or bank account details for premium payment",
        "Birth certificates of dependant children",
        "Marriage certificate (for spousal dependant registration)",
      ],
      applicationUrl: "https://sha.go.ke",
    },

    {
      id: "ke-program-kcic-crop-insurance",
      name: "KCIC Kenya Crop Insurance (Kenya Climate Innovation Centre / AFA Crop Insurance)",
      description:
        "Index-based and yield-based crop insurance programme protecting smallholder farmers against " +
        "weather-related losses (drought, excessive rainfall, floods). " +
        "Premiums are partly subsidised by the government (50% government contribution) under the " +
        "Kenya Crop Insurance Programme administered through AFA and licensed underwriters. " +
        "Payouts are triggered by satellite/weather index data and paid via M-Pesa.",
      jurisdiction: "KE",
      domain: "insurance",
      benefits:
        "Indemnity payout of up to KES 20,000–50,000 per acre upon crop failure (threshold varies by crop/county); " +
        "50% premium subsidy from government; " +
        "payouts made within 14 days of trigger via M-Pesa.",
      eligibilityCriteria: [
        {
          field: "location.countryCode",
          operator: "eq",
          value: "KE",
          description: "Must be a Kenyan resident farmer",
        },
        {
          field: "custom:ke.registeredFarmer",
          operator: "eq",
          value: true,
          description: "Must be registered in the National Farmers Registry",
        },
        {
          field: "custom:ke.cropTypeEligible",
          operator: "in",
          value: ["maize", "wheat", "beans", "sorghum", "tea", "coffee", "potatoes"],
          description:
            "Insured crop must be in the list of covered crop types for the season and county",
        },
        {
          field: "custom:ke.mobileMoneyAccount",
          operator: "eq",
          value: true,
          description: "Active M-Pesa account required for premium payment and payout receipt",
        },
      ],
      requiredDocuments: [
        "National Identity Card",
        "Farm registration certificate",
        "Active M-Pesa account",
        "Insurance proposal form (from accredited insurer: UAP, Jubilee, APA Insurance)",
        "Planted area declaration (endorsed by ward agriculture officer or sub-county office)",
      ],
      applicationUrl: "https://www.kilimo.go.ke/index.php/crop-insurance",
    },

    {
      id: "ke-program-youth-enterprise-fund",
      name: "Youth Enterprise Development Fund (YEDF)",
      description:
        "Government fund established to provide access to credit and business development support to " +
        "Kenyan youth (18–35 years) for enterprise creation and growth. " +
        "Loans are channelled through Youth Enterprise Savings and Credit Cooperatives (SACCOs) " +
        "and Constituency Youth Enterprise Scheme (constituency-level). " +
        "Interest rate: 8% per annum (below market rate).",
      jurisdiction: "KE",
      domain: "employment",
      benefits:
        "Loan amounts: KES 50,000–2,000,000 (constituency window: up to KES 1,000,000 per group); " +
        "interest rate: 8% per annum flat; " +
        "repayment period: up to 3 years; " +
        "business development training and mentorship included.",
      eligibilityCriteria: [
        {
          field: "location.countryCode",
          operator: "eq",
          value: "KE",
          description: "Must be a Kenyan citizen",
        },
        {
          field: "age",
          operator: "gte",
          value: 18,
          description: "Must be at least 18 years old",
        },
        {
          field: "age",
          operator: "lte",
          value: 35,
          description: "Must not exceed 35 years of age",
        },
        {
          field: "custom:ke.businessPlan",
          operator: "eq",
          value: true,
          description: "Must have a viable business plan (assessed by YEDF/SACCO)",
        },
        {
          field: "custom:ke.groupMember",
          operator: "eq",
          value: true,
          description:
            "For constituency window: must be a registered group (minimum 5 members) or SACCO member; " +
            "individual loans available through accredited financial intermediaries",
        },
      ],
      requiredDocuments: [
        "National Identity Card",
        "Kenya Revenue Authority (KRA) PIN certificate",
        "Business plan or concept paper",
        "Certificate of business registration (from Registrar of Companies or county trade office)",
        "Certificate of group registration (for group applications)",
        "Bank statements or M-Pesa statement (last 3 months)",
        "Two character references",
        "Passport-size photographs",
      ],
      applicationUrl: "https://www.youthfund.go.ke",
    },

    {
      id: "ke-program-ctop",
      name: "Cash Transfer for Older Persons (CTOP) — Inua Jamii 70+",
      description:
        "Social protection programme providing unconditional bi-monthly cash transfers to Kenyan citizens " +
        "aged 70 years and above. Implemented by the State Department for Social Protection under the " +
        "Ministry of Labour and Social Protection. " +
        "Transfer amount: KES 4,000 per beneficiary per month (paid bi-monthly as KES 8,000). " +
        "Payments made via M-Pesa, Equity Bank, or KCB Bank.",
      jurisdiction: "KE",
      domain: "cash-transfer",
      benefits:
        "KES 4,000 per month (KES 8,000 bi-monthly) unconditional cash transfer; " +
        "SHA/NHIF health insurance premiums covered by government; " +
        "access to county-level support services.",
      eligibilityCriteria: [
        {
          field: "location.countryCode",
          operator: "eq",
          value: "KE",
          description: "Must be a Kenyan citizen",
        },
        {
          field: "age",
          operator: "gte",
          value: 70,
          description: "Must be 70 years of age or older",
        },
        {
          field: "custom:ke.nationalIdRegistered",
          operator: "eq",
          value: true,
          description: "Must have a valid Kenyan national ID card",
        },
        {
          field: "incomeAnnualCents",
          operator: "lte",
          value: 6000000,
          description:
            "Must be poor or vulnerable — means-testing via the Social Protection Management Information System (SP-MIS) " +
            "using Proxy Means Testing (PMT) score; income threshold approximately KES 60,000/year",
        },
        {
          field: "custom:ke.mobileMoneyAccount",
          operator: "eq",
          value: true,
          description: "Must have M-Pesa or bank account in own name for payment receipt",
        },
      ],
      requiredDocuments: [
        "National Identity Card",
        "Birth certificate (if ID shows date of birth as unclear)",
        "M-Pesa account registered in own name (or bank account passbook)",
        "Community social worker assessment form",
        "Proof of residence (village elder's letter, sub-location chief's letter)",
      ],
      applicationUrl: "https://www.socialprotection.go.ke",
    },
  ],

  // -------------------------------------------------------------------------
  // Processes
  // -------------------------------------------------------------------------
  processes: [
    {
      id: "ke-process-e-subsidy-redemption",
      programId: "ke-program-e-subsidy",
      name: "E-Subsidy Fertilizer Registration and Redemption",
      estimatedDuration: "1–2 weeks (registration); redemption at agro-dealer same day",
      cost: "Subsidised farmer share: approx. KES 2,500 per bag of DAP (50kg)",
      steps: [
        {
          id: "ke-step-esubsidy-1",
          order: 1,
          title: "Register as Farmer in National Farmers Registry (NFR)",
          description:
            "Visit your Sub-County Agriculture Office or Ward Agriculture Officer to register in the " +
            "National Farmers Registry (NFR). Provide your national ID, land details, and crop information. " +
            "The officer captures details on a tablet/mobile device and registers your farm GPS coordinates. " +
            "You receive an SMS confirmation on your M-Pesa-linked number upon successful registration.",
          location: "Sub-County Agriculture Office or Ward Agriculture Officer",
          documents: [
            "National Identity Card",
            "Land title deed or tenancy/lease agreement or letter from village chief/elder",
            "Active M-Pesa account (SIM card with registered name)",
          ],
          tips: [
            "Ensure your M-Pesa number is registered in your own name — UFAA regulations require this for subsidy payments.",
            "If you farm communal land, bring an endorsement letter from the local chief (Mzee wa Kijiji).",
          ],
          commonPitfalls: [
            "Registering farm land under a relative's ID — you will be blocked at redemption if ID and M-Pesa name don't match.",
          ],
        },
        {
          id: "ke-step-esubsidy-2",
          order: 2,
          title: "Receive E-Voucher SMS and Confirm Allocation",
          description:
            "At the start of the planting season (long rains: March–April; short rains: October), " +
            "the Ministry of Agriculture sends an e-voucher code via SMS to all registered farmers. " +
            "The code specifies your fertilizer allocation (number of bags and type). " +
            "Confirm receipt by replying to the SMS or via the *384# USSD short code.",
          location: "Mobile phone (SMS-based)",
          tips: [
            "Save the e-voucher code immediately — do not share it with anyone.",
            "If you don't receive the SMS by the season start date, visit the Ward Agriculture Officer to check your registry status.",
          ],
          commonPitfalls: [
            "Sharing your e-voucher code with agro-dealers before you are present — this enables fraud.",
          ],
        },
        {
          id: "ke-step-esubsidy-3",
          order: 3,
          title: "Visit Registered Agro-Dealer and Redeem Voucher",
          description:
            "Take your national ID and voucher code to an AFA-registered agro-dealer in your sub-county. " +
            "The agro-dealer verifies your identity and scans/enters the e-voucher code on their POS device or " +
            "mobile handset. You pay the subsidised farmer share (approx. KES 2,500/bag) via M-Pesa or cash. " +
            "The agro-dealer releases the bags and provides a receipt.",
          location: "AFA-registered agro-dealer (list available at Sub-County Agriculture Office)",
          documents: ["National ID card", "E-voucher code (from SMS)"],
          tips: [
            "Only buy from AFA-registered agro-dealers — unregistered dealers cannot process e-vouchers and may sell counterfeit fertilizer.",
            "Check the fertilizer bag NCPB stamp for authenticity.",
          ],
          commonPitfalls: [
            "Attempting to redeem at a non-registered dealer — the code will not work.",
            "Waiting too long — e-vouchers expire at the end of the planting window.",
          ],
        },
        {
          id: "ke-step-esubsidy-4",
          order: 4,
          title: "Receive M-Pesa Payment Confirmation and Keep Records",
          description:
            "After redemption, you receive an M-Pesa SMS confirming the amount paid and the transaction ID. " +
            "Keep the agro-dealer receipt and M-Pesa confirmation for your records. " +
            "The Ministry tracks redemptions in real time via the digital platform. " +
            "You can check your subsidy history via the *384# USSD code.",
          location: "Mobile phone (M-Pesa confirmation)",
          tips: [
            "Store receipts in case of a dispute — you can raise a complaint with the Ward Agriculture Officer.",
          ],
        },
      ],
    },

    {
      id: "ke-process-nhif-registration",
      programId: "ke-program-nhif",
      name: "SHA/NHIF Registration and Monthly Contribution (Informal Sector)",
      estimatedDuration: "1–3 days (registration); coverage active after 2 months of contributions",
      cost: "KES 500/month premium for voluntary/community members (SHA Community Scheme)",
      steps: [
        {
          id: "ke-step-nhif-1",
          order: 1,
          title: "Visit Nearest Huduma Centre or SHA/NHIF Office to Register",
          description:
            "Visit the nearest Huduma Centre, SHA/NHIF branch, or accredited agent. " +
            "Complete Form NHIF/1A (self-employed/voluntary registration form). " +
            "Capture biometric data (fingerprints and photograph) on-site. " +
            "Declare all dependants (spouse, children under 26 years). " +
            "The SHA/NHIF card is issued on the spot or within 7 days by post.",
          location: "Huduma Centre or SHA/NHIF branch office (nationwide)",
          documents: [
            "National Identity Card",
            "Passport-size photograph (2 copies)",
            "Completed Form NHIF/1A",
            "Birth certificates for dependent children",
            "Marriage certificate for spousal dependant",
          ],
          tips: [
            "Register all eligible dependants at the time of registration to avoid delays later.",
            "Huduma Centres in county headquarters have shorter queues than Nairobi CBD offices.",
          ],
        },
        {
          id: "ke-step-nhif-2",
          order: 2,
          title: "Set Up Monthly Premium Payment via M-Pesa (Paybill)",
          description:
            "Pay monthly contributions of KES 500 using M-Pesa Paybill Number 200222. " +
            "Account number: your SHA/NHIF membership number. " +
            "Payments should be made by the last day of each month. " +
            "Two months of continuous contribution must be completed before full inpatient benefits activate.",
          location: "M-Pesa on any mobile phone (*150# or M-Pesa app)",
          tips: [
            "Set a monthly M-Pesa standing order if your bank/Safaricom account supports it.",
            "Keep all M-Pesa confirmation messages as payment proof.",
          ],
          commonPitfalls: [
            "Entering the wrong account number — always double-check the membership number before sending.",
            "Lapsed contributions: benefits are suspended after 3 months of non-payment and require reinstatement.",
          ],
        },
        {
          id: "ke-step-nhif-3",
          order: 3,
          title: "Access Healthcare at SHA-Accredited Facility",
          description:
            "Present your SHA/NHIF card and national ID at any SHA-accredited health facility (government hospitals, " +
            "accredited private hospitals and clinics). " +
            "For inpatient care: SHA pays the bed charges, surgical fees, and standard drugs; " +
            "you pay any extras (preferred ward, private room). " +
            "Verify facility accreditation at sha.go.ke or via the SHA mobile app.",
          location: "SHA/NHIF-accredited health facility",
          documents: ["SHA/NHIF membership card", "National ID"],
          tips: [
            "County Referral Hospitals and Level 4/5 facilities are all SHA-accredited.",
            "Pre-authorise elective surgeries with SHA before admission by calling 020-2723000.",
          ],
          commonPitfalls: [
            "Seeking care at non-accredited facilities — SHA will not reimburse such costs.",
          ],
        },
      ],
    },

    {
      id: "ke-process-ctop-enrollment",
      programId: "ke-program-ctop",
      name: "Cash Transfer for Older Persons (Inua Jamii 70+) Enrollment",
      estimatedDuration: "1–3 months (registration to first payment)",
      cost: "Free",
      steps: [
        {
          id: "ke-step-ctop-1",
          order: 1,
          title: "Community Identification and Social Worker Assessment",
          description:
            "Community-based targeting: sub-location Social Development Officers (SDOs) and community " +
            "volunteers identify and visit potential beneficiaries aged 70+ in their homes. " +
            "The SDO conducts a Proxy Means Test (PMT) assessment using the National Social Protection MIS. " +
            "Alternatively, elderly individuals or family members can self-present at the sub-county Social " +
            "Development Office.",
          location: "Beneficiary's home or Sub-County Social Development Office",
          documents: [
            "National Identity Card",
            "Any document confirming age if date of birth is not on ID (birth certificate, baptism record, chief's letter)",
          ],
          tips: [
            "If you are 70+ and have not been visited by an SDO, go directly to the Sub-County Social Development Office — do not wait.",
            "Bring a family member or trusted neighbour to the assessment if mobility is limited.",
          ],
        },
        {
          id: "ke-step-ctop-2",
          order: 2,
          title: "Registration and Biometric Enrolment at Sub-County Office",
          description:
            "Qualifying individuals are enrolled at the Sub-County Social Development Office. " +
            "Biometric data (fingerprints, photograph) is captured. " +
            "Payment method is selected: M-Pesa (preferred), Equity Bank, or KCB Bank. " +
            "For elderly without M-Pesa, a proxy payment authorisation can be set up for a trusted family member.",
          location: "Sub-County Social Development Office",
          documents: [
            "National Identity Card",
            "M-Pesa account details (own name) or bank account passbook",
            "Proxy authorisation form (if using a proxy for payment collection)",
          ],
          tips: [
            "M-Pesa payment is the fastest and most reliable option — activate M-Pesa before enrolment if possible.",
            "If using a proxy, the proxy's national ID and M-Pesa account details are also required.",
          ],
          commonPitfalls: [
            "Registering under a child's M-Pesa number instead of the beneficiary's own — this causes payment delays and fraud risks.",
          ],
        },
        {
          id: "ke-step-ctop-3",
          order: 3,
          title: "Verification and Approval in SP-MIS",
          description:
            "County Social Development Department reviews and approves new enrolments in the Social " +
            "Protection Management Information System (SP-MIS). " +
            "Data is forwarded to the State Department for Social Protection (Nairobi) for national approval. " +
            "The beneficiary receives an SMS confirmation when approved.",
          location:
            "County Social Development Department and State Department for Social Protection (administrative process)",
          tips: [
            "The process typically takes 4–8 weeks. Follow up with the Sub-County SDO after 4 weeks if no confirmation received.",
          ],
        },
        {
          id: "ke-step-ctop-4",
          order: 4,
          title: "First Bi-Monthly Payment Disbursed via M-Pesa",
          description:
            "Payments are disbursed bi-monthly (every two months). " +
            "KES 8,000 is sent directly to the beneficiary's M-Pesa or bank account. " +
            "An SMS alert is sent at time of payment. " +
            "Beneficiaries must confirm receipt; persistent non-confirmation triggers a field visit.",
          location: "M-Pesa mobile phone or bank branch",
          tips: [
            "Withdraw from M-Pesa at the nearest M-Pesa agent — do not share your M-Pesa PIN with anyone including family.",
            "If the payment doesn't arrive within 3 days of the scheduled date, visit the Sub-County SDO.",
          ],
          commonPitfalls: [
            "M-Pesa account becoming inactive (no transactions for 12 months) — keep the account active by making at least one transaction every few months.",
          ],
        },
        {
          id: "ke-step-ctop-5",
          order: 5,
          title: "Annual Beneficiary Verification (Proof of Life)",
          description:
            "Each year, all CTOP beneficiaries must confirm they are still alive and residing in Kenya. " +
            "Sub-County SDOs conduct home visits or call beneficiaries to conduct proof-of-life verification. " +
            "Beneficiaries may also visit the Sub-County office or use the SHA/NHIF biometric system at a health facility. " +
            "Failure to verify within the verification window suspends payments pending field visit.",
          location: "Beneficiary's home (SDO visit) or Sub-County Social Development Office",
          documents: ["National Identity Card"],
          tips: [
            "Confirm the annual verification schedule with your Sub-County SDO — it is usually announced in November.",
          ],
        },
      ],
    },

    {
      id: "ke-process-yedf-loan",
      programId: "ke-program-youth-enterprise-fund",
      name: "YEDF Constituency Youth Enterprise Scheme Loan Application",
      estimatedDuration: "1–3 months (application to disbursement)",
      cost: "8% interest per annum flat; no application fee",
      steps: [
        {
          id: "ke-step-yedf-1",
          order: 1,
          title: "Form or Join a Registered Youth Group",
          description:
            "The constituency window requires a registered youth group of 5–15 members (aged 18–35). " +
            "Register the group with the Sub-County Social Development Office or county government. " +
            "Each member must have a valid ID, KRA PIN, and an active bank account or M-Pesa.",
          location: "Sub-County Social Development Office or County Youth Office",
          documents: [
            "National ID cards of all members",
            "KRA PIN certificates of all members",
            "Group constitution / meeting minutes",
            "Bank account opening documents for group account",
          ],
          tips: [
            "Choose group members you trust — all members are jointly liable for the loan repayment.",
            "A group bank account at a licensed bank is required for loan disbursement (individual M-Pesa not accepted for group loans).",
          ],
        },
        {
          id: "ke-step-yedf-2",
          order: 2,
          title: "Attend YEDF Business Training and Develop Business Plan",
          description:
            "YEDF and its implementing partners provide free 3–5 day business development training " +
            "at constituency level. Attendance is mandatory for loan applicants. " +
            "At the end of training, prepare a business plan using YEDF templates. " +
            "The plan should cover: market analysis, projected revenue, loan use, repayment plan.",
          location: "Constituency YEDF office or county training centre",
          documents: ["Completed YEDF business plan template", "Training attendance certificate"],
          tips: [
            "Be realistic about revenue projections — inflated figures are spotted during appraisal.",
            "Include a clear M-Pesa or bank account payment schedule for loan repayment.",
          ],
        },
        {
          id: "ke-step-yedf-3",
          order: 3,
          title: "Submit Loan Application to Constituency YEDF Coordinator",
          description:
            "Submit the completed application form, business plan, group registration documents, and " +
            "financial statements to the Constituency YEDF Coordinator. " +
            "The Coordinator conducts an appraisal of the business plan and group viability. " +
            "A site visit may be conducted to verify the proposed business location.",
          location: "Constituency YEDF Coordinator office (at constituency office or CDF office)",
          documents: [
            "YEDF loan application form",
            "Business plan",
            "Group registration certificate",
            "Bank statements (group and individual, last 3 months)",
            "KRA PIN certificates",
            "National IDs",
          ],
          tips: [
            "Present yourselves at the interview as a cohesive group — coordinator assesses group dynamics.",
          ],
          commonPitfalls: [
            "Submitting an application without attending the mandatory training — automatically disqualified.",
            "Applying for a loan amount larger than what the business plan can justify.",
          ],
        },
        {
          id: "ke-step-yedf-4",
          order: 4,
          title: "Loan Approval, Agreement Signing, and Disbursement",
          description:
            "Approved loans are disbursed by the YEDF Board directly to the group bank account. " +
            "All group members sign the loan agreement, which includes the repayment schedule. " +
            "First repayment typically begins 1–3 months after disbursement. " +
            "Repayment is tracked via YEDF's online portal and M-Pesa Paybill.",
          location:
            "Constituency YEDF Coordinator office (for signing) and group bank account (for receipt)",
          documents: [
            "YEDF loan agreement (signed by all members)",
            "Board resolution authorising signing officers for group account",
          ],
          tips: [
            "Use the funds strictly as stated in the business plan — spot checks are conducted.",
            "Set up M-Pesa contributions from each member at the start of the month to ensure timely group loan repayments.",
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
      id: "ke-inst-afa",
      name: "Agriculture and Food Authority (AFA)",
      type: "federal-agency",
      jurisdiction: "KE",
      address: "Kilimo House, Cathedral Road, Nairobi",
      phone: "+254 020 2718870",
      website: "https://afa.go.ke",
      hours: "Mon–Fri 08:00–17:00",
      waitTime: "Counter services: 1–3 hours; registration decisions: 1–2 weeks",
    },
    {
      id: "ke-inst-sha",
      name: "Social Health Authority (SHA) / National Hospital Insurance Fund (NHIF)",
      type: "federal-agency",
      jurisdiction: "KE",
      address: "Hospital Hill, off Ngong Road, Nairobi (Headquarters)",
      phone: "+254 020 2723000",
      website: "https://sha.go.ke",
      hours: "Mon–Fri 08:00–17:00",
      waitTime: "Huduma Centres: 30 minutes–2 hours; main office: 2–5 hours",
    },
    {
      id: "ke-inst-yedf",
      name: "Youth Enterprise Development Fund (YEDF)",
      type: "federal-agency",
      jurisdiction: "KE",
      address: "Anniversary Towers, University Way, Nairobi",
      phone: "+254 020 2211620",
      website: "https://www.youthfund.go.ke",
      hours: "Mon–Fri 08:00–17:00",
      waitTime: "Constituency office: 30 minutes–2 hours; loan processing: 4–12 weeks",
    },
    {
      id: "ke-inst-social-protection",
      name: "State Department for Social Protection",
      type: "federal-agency",
      jurisdiction: "KE",
      address: "Social Security House, Bishops Road, Nairobi",
      phone: "+254 020 2729800",
      website: "https://www.socialprotection.go.ke",
      hours: "Mon–Fri 08:00–17:00",
      waitTime: "Sub-County offices: 1–3 hours; CTOP enrollment processing: 4–8 weeks",
    },
    {
      id: "ke-inst-huduma-centre",
      name: "Huduma Centre (Government Service Delivery Hubs)",
      type: "public-service-outlet",
      jurisdiction: "KE",
      phone: "+254 020 6900020",
      website: "https://www.hudumakenya.go.ke",
      hours: "Mon–Fri 08:00–17:00; select centres open Saturday 09:00–13:00",
      waitTime:
        "Typical wait: 30 minutes–2 hours; online queue management available at major centres",
    },
    {
      id: "ke-inst-ward-agriculture",
      name: "Ward Agriculture Officer (County Government)",
      type: "county-office",
      jurisdiction: "KE",
      address: "Ward administration offices (varies by ward)",
      hours: "Mon–Fri 08:00–17:00",
      waitTime: "Walk-in: typically immediate to 1 hour",
    },
  ],

  // -------------------------------------------------------------------------
  // Rights
  // -------------------------------------------------------------------------
  rights: [
    {
      id: "ke-right-land",
      title: "Right to Land Ownership and Security of Tenure",
      description:
        "Every Kenyan citizen has the right to own and access land for agricultural use. " +
        "The Constitution guarantees equitable access to land and prohibits arbitrary deprivation. " +
        "Community land rights of historically marginalised groups are recognised. " +
        "Women have equal rights to own land under the Constitution and the Land Act.",
      domain: "agriculture",
      legalBasis:
        "Constitution of Kenya 2010, Article 40 (Protection of right to property); " +
        "Land Act 2012 (No. 6 of 2012); Community Land Act 2016; " +
        "Land Registration Act 2012; National Land Policy 2009",
      appealDeadline:
        "Land dispute to Environment and Land Court: within 5 years of cause of action",
    },
    {
      id: "ke-right-food-security",
      title: "Right to Food and Freedom from Hunger",
      description:
        "Every Kenyan has the right to food of acceptable quality in sufficient quantities to satisfy " +
        "their nutritional needs for a healthy life, and the right to be free from hunger. " +
        "The state must progressively achieve food security through agricultural subsidies, social " +
        "protection programmes, and strategic grain reserves.",
      domain: "nutrition",
      legalBasis:
        "Constitution of Kenya 2010, Article 43(1)(c) (right to be free from hunger); " +
        "National Food and Nutrition Security Policy 2011; " +
        "AU Maputo Declaration on Agriculture (15% budget to agriculture); " +
        "UN ICESCR Article 11 (ratified by Kenya)",
    },
    {
      id: "ke-right-health",
      title: "Right to the Highest Attainable Standard of Health",
      description:
        "Every Kenyan has the right to the highest attainable standard of health, including the right " +
        "to healthcare services. Emergency medical treatment cannot be refused. " +
        "Maternal health services and basic health care for children under 5 must be provided free " +
        "at public health facilities.",
      domain: "health",
      legalBasis:
        "Constitution of Kenya 2010, Article 43(1)(a) and Article 53(1)(c) (children's right to health); " +
        "Health Act 2017; Social Health Insurance Act 2023; " +
        "UN ICESCR Article 12",
    },
    {
      id: "ke-right-social-security",
      title: "Right to Social Security and Social Protection",
      description:
        "Every Kenyan has the right to social security, including access to social protection schemes " +
        "for older persons, persons with disabilities, and vulnerable groups. " +
        "The CTOP, Orphans and Vulnerable Children (OVC), and Persons with Severe Disabilities (PWSD) " +
        "cash transfer programmes implement this constitutional right.",
      domain: "social-protection",
      legalBasis:
        "Constitution of Kenya 2010, Articles 43(1)(e) and 57 (rights of older members of society); " +
        "Social Assistance Act 2013; National Social Protection Policy 2011; " +
        "Older Persons Protection Policy 2019",
    },
    {
      id: "ke-right-youth-employment",
      title: "Right to Youth Economic Empowerment and Employment",
      description:
        "Young Kenyans (18–35) have constitutional rights to economic and social opportunities, including " +
        "access to government employment and business creation funds. " +
        "The state must ensure at least 30% of public procurement is accessible to youth, women, and PWDs. " +
        "YEDF and Uwezo Fund implement these rights through accessible credit.",
      domain: "employment",
      legalBasis:
        "Constitution of Kenya 2010, Article 55 (rights of youth); " +
        "Youth Enterprise Development Fund Act 2006; " +
        "Public Procurement and Asset Disposal Act 2015, Section 157 (access to government procurement); " +
        "National Youth Policy 2019",
      appealDeadline: "Public Procurement complaints: 14 days to PPARB from notification of award",
    },
    {
      id: "ke-right-access-information",
      title: "Right to Access Information on Government Programs",
      description:
        "Every Kenyan has the right of access to information held by any public body, including " +
        "information about eligibility criteria, beneficiary lists, and programme expenditures. " +
        "This right supports accountability in fertilizer subsidy, cash transfer, and insurance programmes. " +
        "Social audits and community scorecards are rights-based accountability mechanisms.",
      domain: "legal",
      legalBasis:
        "Constitution of Kenya 2010, Article 35 (right of access to information); " +
        "Access to Information Act 2016; " +
        "Public Finance Management Act 2012 (transparency requirements)",
      appealDeadline:
        "Response required within 21 days of request; appeal to Commission on Administrative Justice within 60 days",
    },
  ],
};
