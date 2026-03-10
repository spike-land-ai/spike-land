/**
 * COMPASS Seed Data — Germany (Federal Republic of Germany)
 *
 * Focus domain: Refugee integration
 * Key programs: Asylantrag, Integrationskurs, Arbeitserlaubnis,
 *               Familienzusammenführung, Wohnraumhilfe
 * Key institutions: BAMF, Ausländerbehörde, Jobcenter, Sozialamt
 *
 * Data reflects the legal situation as of early 2026. Individual Länder
 * (states) may add programs or processing times may vary by Ausländerbehörde.
 */

import type { CountrySeed } from "../types.js";

export const germanySeed: CountrySeed = {
  jurisdiction: {
    id: "jurisdiction-de",
    name: "Federal Republic of Germany",
    code: "DE",
    languages: ["de"],
    currency: "EUR",
    governmentType: "Federal parliamentary republic",
  },

  // -------------------------------------------------------------------------
  // Programs
  // -------------------------------------------------------------------------
  programs: [
    {
      id: "de-program-asylum",
      name: "Asylantrag (Asylum Application)",
      description:
        "Formal application for international protection under the Asylum Procedures Act (AsylG). " +
        "Grants access to accommodation, basic subsistence, and legal representation while the " +
        "Bundesamt für Migration und Flüchtlinge (BAMF) adjudicates the claim.",
      jurisdiction: "DE",
      domain: "refugee-integration",
      benefits:
        "Residence permit during proceedings; accommodation in reception centre (Aufnahmeeinrichtung); " +
        "monthly cash allowance under Asylbewerberleistungsgesetz (AsylbLG) of approx. EUR 460 for adults; " +
        "access to emergency healthcare; legal representation rights.",
      eligibilityCriteria: [
        {
          field: "citizenshipStatus",
          operator: "in",
          value: ["asylumSeeker", "refugee"],
          description: "Applicant must be an asylum seeker or recognised refugee",
        },
        {
          field: "location.countryCode",
          operator: "eq",
          value: "DE",
          description: "Applicant must be physically present in Germany",
        },
        {
          field: "custom:de.hasFiledAsylumClaim",
          operator: "eq",
          value: false,
          description: "Asylum claim must not have been previously adjudicated in Germany",
        },
      ],
      requiredDocuments: [
        "Passport or travel document (or written explanation of why none is available)",
        "Birth certificate (if available)",
        "Any documents evidencing persecution or risk of serious harm",
        "Completed BAMF registration form (Ankunftsnachweis)",
      ],
      applicationUrl:
        "https://www.bamf.de/DE/Themen/AsylFluechtlingsschutz/AblaufAsylverfahrens/ablaufasylverfahrens-node.html",
    },

    {
      id: "de-program-integration-course",
      name: "Integrationskurs (Integration Course)",
      description:
        "State-funded language and civic education programme consisting of up to 700 hours of German " +
        "language instruction (levels A1–B1) plus 100 hours of orientation course covering German law, " +
        "history, and culture. Managed by BAMF and delivered through certified course providers.",
      jurisdiction: "DE",
      domain: "refugee-integration",
      benefits:
        "Subsidised German language classes (participants pay EUR 2.20/hour, waived for Jobcenter clients); " +
        "recognised B1 certificate (DTZ) upon passing final exam; " +
        "early access can reduce naturalisation waiting period.",
      eligibilityCriteria: [
        {
          field: "citizenshipStatus",
          operator: "in",
          value: ["refugee", "permanentResident", "temporaryVisa"],
          description:
            "Applicant must hold a valid residence permit or recognition as refugee/subsidiary protection",
        },
        {
          field: "location.countryCode",
          operator: "eq",
          value: "DE",
          description: "Must be resident in Germany",
        },
        {
          field: "custom:de.germanProficiencyLevel",
          operator: "lte",
          value: "A2",
          description: "German language level must be A2 or below (or no prior knowledge)",
        },
      ],
      requiredDocuments: [
        "Valid residence permit (Aufenthaltstitel) or asylum seeker certificate (Aufenthaltsgestattung)",
        "BAMF integration course authorisation letter (Berechtigungsschreiben)",
        "Passport or identity document",
      ],
      applicationUrl:
        "https://www.bamf.de/DE/Themen/Integration/Integrationskurse/integrationskurse-node.html",
    },

    {
      id: "de-program-work-permit",
      name: "Beschäftigungserlaubnis (Work Permit for Asylum Seekers)",
      description:
        "Permission granted by the Ausländerbehörde allowing asylum seekers and tolerated persons " +
        "(Geduldete) to take up employment after an initial waiting period. After 15 months residence " +
        "recognised refugees have unrestricted labour market access.",
      jurisdiction: "DE",
      domain: "employment",
      benefits:
        "Right to accept paid employment; after 48 months unrestricted; " +
        "access to Jobcenter support and ALG II/Bürgergeld if unemployed after labour market access granted.",
      eligibilityCriteria: [
        {
          field: "citizenshipStatus",
          operator: "in",
          value: ["asylumSeeker", "refugee", "temporaryVisa"],
          description:
            "Must be an asylum seeker, recognised refugee, or holder of a toleration (Duldung)",
        },
        {
          field: "location.countryCode",
          operator: "eq",
          value: "DE",
          description: "Must be resident in Germany",
        },
        {
          field: "custom:de.residenceMonths",
          operator: "gte",
          value: 3,
          description:
            "Must have resided in Germany for at least 3 months (general rule; earlier possible in some Länder)",
        },
        {
          field: "custom:de.employmentBanApplied",
          operator: "eq",
          value: false,
          description: "No active Beschäftigungsverbot must be in place",
        },
      ],
      requiredDocuments: [
        "Aufenthaltsgestattung or Duldung certificate",
        "Job offer letter from prospective employer",
        "Completed BA-Zustimmungsantrag form (Federal Employment Agency consent)",
        "Qualifications and professional certificates (if applicable)",
      ],
      applicationUrl: "https://www.make-it-in-germany.com/de/visum/arten/arbeit",
    },

    {
      id: "de-program-family-reunification",
      name: "Familiennachzug (Family Reunification)",
      description:
        "Residence permit allowing immediate family members (spouse, minor children) of refugees and " +
        "persons with subsidiary protection to join them in Germany. Governed by AufenthG § 29 et seq.",
      jurisdiction: "DE",
      domain: "refugee-integration",
      benefits:
        "Family members receive own residence permit (Aufenthaltstitel); " +
        "access to Integrationskurs; right to work; children's right to schooling.",
      eligibilityCriteria: [
        {
          field: "custom:de.sponsorRecognitionStatus",
          operator: "in",
          value: ["refugee", "subsidiaryProtection"],
          description: "Sponsor in Germany must hold refugee status or subsidiary protection",
        },
        {
          field: "custom:de.familyRelationship",
          operator: "in",
          value: ["spouse", "registeredPartner", "minorChild"],
          description:
            "Applicant must be spouse, registered partner, or minor child of the sponsor",
        },
        {
          field: "custom:de.sponsorHasAdequateHousing",
          operator: "eq",
          value: true,
          description: "Sponsor must have adequate housing for the family (Wohnraum)",
        },
        {
          field: "custom:de.basicGermanKnowledge",
          operator: "eq",
          value: true,
          description:
            "Spouse must demonstrate basic German (A1) unless an exception applies (hardship, disability)",
        },
      ],
      requiredDocuments: [
        "Valid passport of applicant",
        "Sponsor's residence permit (Aufenthaltstitel)",
        "Marriage certificate or birth certificate (apostilled or legalised)",
        "Proof of adequate housing (Wohnraumnachweis)",
        "Proof of A1 German language certificate (for spouses; waived for refugees with subsidiary protection in first 3 months)",
        "Recent passport-size photographs",
      ],
      applicationUrl:
        "https://www.bamf.de/DE/Themen/AsylFluechtlingsschutz/FamiliennachzugZuFluechtlingen/familiennachzugzufluechtlingen-node.html",
    },

    {
      id: "de-program-housing-assistance",
      name: "Wohnraumhilfe / Sozialwohnung (Social Housing Assistance)",
      description:
        "Municipal housing assistance for low-income residents including refugees and recognised asylum " +
        "seekers. Administered by local Sozialämter and Wohnungsämter. Includes Wohnberechtigungsschein " +
        "(WBS) — housing entitlement certificate — and direct financial support under SGB XII.",
      jurisdiction: "DE",
      domain: "housing",
      benefits:
        "Access to subsidised social housing (Sozialwohnung); " +
        "Wohngeld (housing benefit) of EUR 100–900/month depending on household size and income; " +
        "emergency accommodation referrals.",
      eligibilityCriteria: [
        {
          field: "location.countryCode",
          operator: "eq",
          value: "DE",
          description: "Must be resident in Germany",
        },
        {
          field: "citizenshipStatus",
          operator: "in",
          value: ["refugee", "permanentResident", "temporaryVisa", "asylumSeeker"],
          description: "Must hold valid residence permit or asylum seeker certificate",
        },
        {
          field: "incomeAnnualCents",
          operator: "lte",
          value: 2000000,
          description:
            "Annual household income must be below EUR 20,000 (varies by municipality and household size)",
        },
      ],
      requiredDocuments: [
        "Valid residence permit or Aufenthaltsgestattung",
        "Proof of current income (pay slips, benefit statements)",
        "Current rental contract or eviction notice",
        "Identity document",
        "Registration certificate (Anmeldebestätigung) from local Einwohnermeldeamt",
      ],
      applicationUrl:
        "https://www.bmwsb.bund.de/Webs/BMWSB/DE/themen/stadt-wohnen/wohnraumfoerderung/soziale-wohnraumfoerderung/soziale-wohnraumfoerderung-node.html",
    },
  ],

  // -------------------------------------------------------------------------
  // Processes
  // -------------------------------------------------------------------------
  processes: [
    {
      id: "de-process-asylum-application",
      programId: "de-program-asylum",
      name: "Asylum Application Process (Asylverfahren)",
      estimatedDuration: "6–24 months (initial decision); appeals can add 1–3 years",
      cost: "Free",
      steps: [
        {
          id: "de-step-asylum-1",
          order: 1,
          title: "Arrival and Initial Registration (Erstregistrierung)",
          description:
            "Immediately upon arrival in Germany, present yourself to a border control officer, " +
            "police station, or directly to a reception centre (Aufnahmeeinrichtung). " +
            "You will receive an Ankunftsnachweis (arrival certificate) which is your proof of registration " +
            "and grants you access to basic services.",
          location: "Federal or state reception centre (Aufnahmeeinrichtung / ANKER-Zentrum)",
          documents: [
            "Any identity or travel documents you possess (passport, ID card, visa)",
            "Medical certificates if relevant to your claim",
          ],
          tips: [
            "Register as soon as possible — delays can negatively affect credibility assessments.",
            "Inform officers of any medical conditions or vulnerabilities (pregnancy, disability, trauma) immediately.",
            "Minors without parents will be assigned a legal guardian (Vormund) — request this explicitly.",
          ],
          commonPitfalls: [
            "Destroying or discarding travel documents — this complicates identity verification and is not recommended.",
            "Not mentioning family members present in Germany or other EU countries at initial registration.",
          ],
        },
        {
          id: "de-step-asylum-2",
          order: 2,
          title: "BAMF Personal Interview (Anhörung)",
          description:
            "A detailed interview conducted by a BAMF decision-maker where you present the reasons " +
            "for your asylum claim. An interpreter will be provided. This is the most important step — " +
            "the interview record (Protokoll) forms the core of your case file.",
          location: "BAMF branch office (BAMF-Außenstelle)",
          documents: [
            "Ankunftsnachweis or Aufenthaltsgestattung",
            "All original documents evidencing persecution (police reports, court judgments, threatening letters, photographs)",
            "Medical reports if relevant (trauma, injuries from persecution)",
          ],
          tips: [
            "Request a qualified interpreter in your specific language and dialect before the interview date.",
            "You may bring a legal representative or trusted support person.",
            "Provide a detailed, chronological account of events — dates, places, names where known.",
            "Correct the interview protocol immediately if you find errors during the reading-back session.",
          ],
          commonPitfalls: [
            "Providing inconsistent dates or details that differ from initial registration statements.",
            "Failing to mention all grounds for persecution — new grounds raised only on appeal carry less weight.",
            "Not bringing a legal advisor or refugee counsellor to the interview.",
          ],
        },
        {
          id: "de-step-asylum-3",
          order: 3,
          title: "BAMF Written Decision (Bescheid)",
          description:
            "BAMF sends a written decision (Bescheid) by post to your accommodation address. " +
            "The decision may grant refugee status (Flüchtlingsschutz, §3 AsylG), " +
            "subsidiary protection (subsidiärer Schutz, §4 AsylG), " +
            "national prohibition of deportation (Abschiebungsverbot, §60 AufenthG), or rejection.",
          location: "Decision sent to your registered accommodation address",
          documents: [],
          tips: [
            "Ensure your accommodation address is always up to date with BAMF.",
            "Read the Bescheid carefully — it sets the 2-week or 1-month appeal deadline depending on rejection type.",
          ],
          commonPitfalls: [
            "Missing the appeal deadline — it begins from the date of delivery, not the date you read the letter.",
            "Assuming a rejection is final — seek legal advice immediately upon receiving a negative decision.",
          ],
        },
        {
          id: "de-step-asylum-4",
          order: 4,
          title: "Residence Permit Registration at Ausländerbehörde",
          description:
            "Upon a positive decision, visit the local Ausländerbehörde (immigration office) " +
            "to convert your Aufenthaltsgestattung into a formal Aufenthaltstitel " +
            "(typically a 3-year residence permit for refugees). " +
            "Bring the BAMF Bescheid and all identity documents.",
          location: "Local Ausländerbehörde (varies by Wohnsitzgemeinde)",
          documents: [
            "BAMF positive decision (Bescheid)",
            "Aufenthaltsgestattung (previous document)",
            "Biometric passport photos (35×45mm)",
            "Passport or identity document (or Reiseausweis für Ausländer application if no passport)",
            "Proof of address (Anmeldebestätigung)",
          ],
          tips: [
            "Book an appointment (Termin) in advance — walk-in queues at major city offices can be 6–8 hours.",
            "Some Ausländerbehörden offer online appointment booking; check the office website.",
          ],
          commonPitfalls: [
            "Arriving without all required documents — offices typically cannot process incomplete applications on the same day.",
            "Not applying for a Reiseausweis für Ausländer if you have no valid passport — you need this for travel.",
          ],
        },
        {
          id: "de-step-asylum-5",
          order: 5,
          title: "Appeal (Klage) if Rejected — Administrative Court",
          description:
            "If BAMF rejects the application, you may file a Klage (lawsuit) with the competent " +
            "Verwaltungsgericht (administrative court) within the statutory deadline. " +
            "Filing an appeal does not automatically suspend deportation — you must separately request " +
            "an aufschiebende Wirkung (suspensory effect) if at risk of immediate removal.",
          location: "Competent Verwaltungsgericht (administrative court) in the federal state",
          documents: [
            "BAMF rejection decision (Bescheid) — original",
            "Legal representation mandate (Vollmacht) if using a lawyer",
            "All supporting evidence not previously submitted to BAMF",
          ],
          tips: [
            "Seek immediate legal advice from a refugee counsel organisation (e.g. AWO, Caritas, Pro Asyl, RAA) upon receiving rejection.",
            "Pro Bono legal aid (Prozesskostenhilfe) is available for those without means — apply at the court.",
          ],
          commonPitfalls: [
            "Missing the appeal deadline: 2 weeks for manifestly unfounded rejections, 1 month for standard rejections.",
            "Filing without legal representation significantly reduces success rates.",
          ],
        },
      ],
    },

    {
      id: "de-process-integration-course",
      programId: "de-program-integration-course",
      name: "Integration Course Enrolment and Completion",
      estimatedDuration: "6–18 months (depending on hours per week)",
      cost: "EUR 2.20 per class hour (approx. EUR 1,760 total); free for Jobcenter/SGB II recipients",
      steps: [
        {
          id: "de-step-intcourse-1",
          order: 1,
          title: "Obtain BAMF Authorisation Letter (Berechtigungsschreiben)",
          description:
            "Apply at BAMF or your local Ausländerbehörde for an authorisation letter that entitles " +
            "you to attend a BAMF-funded integration course. Jobcenter can also issue referrals (Aufforderung).",
          location: "BAMF branch office or local Ausländerbehörde",
          documents: [
            "Valid residence permit or Aufenthaltsgestattung",
            "Passport or identity document",
          ],
          tips: [
            "If you receive Bürgergeld (ALG II), the Jobcenter can issue the referral — no need to visit BAMF.",
          ],
        },
        {
          id: "de-step-intcourse-2",
          order: 2,
          title: "Find a Course Provider and Register",
          description:
            "Use the BAMF course provider search tool (Kursträgersuche) at bamf.de to find certified " +
            "providers near your address. Contact the provider, present your Berechtigungsschreiben, " +
            "and complete enrolment. Providers arrange a placement test to determine your starting level.",
          location: "Certified integration course provider (Kursträger)",
          documents: ["BAMF Berechtigungsschreiben", "Identity document", "Proof of address"],
          tips: [
            "Evening and weekend courses are available through many providers — useful if you are also working.",
            "Check if childcare (Kinderbetreuung) is available at the course location if you have young children.",
          ],
          applicationUrl:
            "https://www.bamf.de/DE/Themen/Integration/Integrationskurse/Kursfoerderung/Kursplaetze/kursplaetze-node.html",
        },
        {
          id: "de-step-intcourse-3",
          order: 3,
          title: "Complete Language Modules (600 hours) and Orientation Module (100 hours)",
          description:
            "Attend all scheduled classes. The language portion covers A1–B1 (General Integration Course) " +
            "or specialist variants (literacy course, youth course, women's course, parenting course). " +
            "The orientation module covers German Basic Law, history, and democracy.",
          location: "Course provider premises",
          tips: [
            "Attendance is mandatory — missing more than 10% of hours without justification can result in cost recovery.",
            "Request a Lernzielorientierung (learning progress report) midway through the course.",
          ],
          commonPitfalls: [
            "Unexcused absences — always submit a sick note (Krankmeldung) if you cannot attend.",
            "Assuming the orientation module is optional — it is required for the final DTZ certificate.",
          ],
        },
        {
          id: "de-step-intcourse-4",
          order: 4,
          title: "Take the Deutsch-Test für Zuwanderer (DTZ) and Leben in Deutschland Test",
          description:
            "At the end of the course sit two exams: the DTZ (written and oral German test at B1 level) " +
            "and the Leben in Deutschland test (25 questions on civics/orientation). " +
            "Exams are conducted at the course provider by certified examiners from TELC or Goethe-Institut.",
          location: "Examination centre at or near the course provider",
          documents: [
            "Valid identity document (passport or Aufenthaltstitel)",
            "Exam registration confirmation",
          ],
          tips: [
            "Use the free practice materials at telc.net and goethe.de.",
            "You may retake each exam once at reduced cost if you fail the first attempt.",
          ],
        },
        {
          id: "de-step-intcourse-5",
          order: 5,
          title: "Receive Certificate and Inform Ausländerbehörde",
          description:
            "Upon passing, you receive the Integrationskurszertifikat. Notify the Ausländerbehörde — " +
            "this is recorded in your residence permit file and can qualify you for an earlier permanent " +
            "residence permit (Niederlassungserlaubnis after 3 years instead of 5).",
          location: "Ausländerbehörde",
          documents: ["Integrationskurszertifikat", "Valid Aufenthaltstitel"],
        },
      ],
    },

    {
      id: "de-process-family-reunification",
      programId: "de-program-family-reunification",
      name: "Family Reunification Application Process (Familiennachzug)",
      estimatedDuration: "3–12 months (varies by German embassy and sponsor status)",
      cost: "EUR 75 visa fee per adult applicant; EUR 37.50 per child under 18",
      steps: [
        {
          id: "de-step-family-1",
          order: 1,
          title: "Sponsor Applies for Wohnraum-Nachweis and Income Proof",
          description:
            "The sponsor in Germany prepares documentation showing adequate housing and, for most " +
            "categories, sufficient income to support the family without recourse to public funds. " +
            "Recognised refugees (§3 AsylG) and subsidiary protection holders are exempt from income " +
            "requirements in the first 3 months of their status.",
          location: "Sponsor's home municipality — Wohnungsamt and Arbeitgeber",
          documents: [
            "Current rental contract showing apartment size (minimum 12m² per additional person)",
            "Recent pay slips or income statement (last 3 months)",
            "Sponsor's Aufenthaltstitel",
          ],
          tips: [
            "Prepare a Verpflichtungserklärung (formal undertaking of financial responsibility) only if income requirement applies.",
          ],
        },
        {
          id: "de-step-family-2",
          order: 2,
          title: "Family Member Applies for Visa at German Embassy",
          description:
            "The family member abroad books an appointment at the nearest German embassy or consulate " +
            "and submits the National Visa (D-Visum) application for Familiennachzug. " +
            "Waiting times for appointment slots vary from 1 week to 12 months depending on the country.",
          location: "German Embassy or Consulate in the country of residence",
          documents: [
            "Valid national passport (minimum 6 months validity beyond intended stay)",
            "Completed visa application form (Antrag auf Erteilung eines nationalen Visums)",
            "Recent biometric passport photographs",
            "Marriage or birth certificate (apostilled or legalised and translated into German by certified translator)",
            "Sponsor's residence permit copy and BAMF decision",
            "Proof of sponsor's housing",
            "Proof of A1 German (for spouses not exempt)",
            "Proof of health insurance coverage on entry",
          ],
          tips: [
            "Book the earliest available appointment — the date of booking does not affect the visa start date.",
            "Begin German language A1 preparation as soon as possible — evening courses are widely available abroad.",
          ],
          commonPitfalls: [
            "Document legalisation and translation can take 2–6 months — start early.",
            "Submitting uncertified translations — all foreign-language documents must be translated by a sworn translator (beeidigter Übersetzer).",
          ],
        },
        {
          id: "de-step-family-3",
          order: 3,
          title: "Embassy Interview and Biometrics",
          description:
            "Attend the in-person appointment for document review, biometric data collection (fingerprints, photo), " +
            "and a brief interview on family circumstances. " +
            "The embassy forwards the application to the Ausländerbehörde of the sponsor's municipality for approval.",
          location: "German Embassy or Consulate",
          documents: ["All documents from Step 2"],
          tips: [
            "Bring originals and copies of every document.",
            "Children aged 12 and over must attend in person for biometrics.",
          ],
        },
        {
          id: "de-step-family-4",
          order: 4,
          title: "Visa Issued and Travel to Germany",
          description:
            "If approved, the D-Visum is affixed to the passport. Travel to Germany within the validity " +
            "period. The visa is typically valid for 3–6 months and allows a single entry.",
          location: "Travel from country of origin to Germany",
          tips: [
            "Inform the sponsor immediately of travel plans — the Ausländerbehörde appointment for residence permit must be booked promptly after arrival.",
          ],
        },
        {
          id: "de-step-family-5",
          order: 5,
          title: "Register Residence and Obtain Aufenthaltstitel in Germany",
          description:
            "Within 2 weeks of arrival, register at the local Einwohnermeldeamt (resident registration office). " +
            "Then visit the Ausländerbehörde to convert the D-Visum into a full Aufenthaltstitel for family reunification.",
          location: "Local Einwohnermeldeamt, then Ausländerbehörde",
          documents: [
            "Passport with D-Visum",
            "Anmeldebestätigung from Einwohnermeldeamt",
            "Sponsor's Aufenthaltstitel",
            "Biometric photographs",
          ],
          tips: [
            "Children must also be registered and receive their own Aufenthaltstitel.",
            "Enrol children in school immediately — schooling is compulsory (Schulpflicht) from day of registration.",
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
      id: "de-inst-bamf",
      name: "Bundesamt für Migration und Flüchtlinge (BAMF)",
      type: "federal-agency",
      jurisdiction: "DE",
      address: "Frankenstraße 210, 90461 Nürnberg (Head Office)",
      phone: "+49 911 943-0",
      website: "https://www.bamf.de",
      hours: "Mon–Thu 08:00–17:00, Fri 08:00–14:00 (branch offices vary)",
      waitTime: "Appointment wait: 2–8 weeks; Anhörung scheduling: 3–18 months",
    },
    {
      id: "de-inst-auslaenderbehoerde",
      name: "Ausländerbehörde (Local Immigration Office)",
      type: "municipal-office",
      jurisdiction: "DE",
      address: "Location varies by municipality (Gemeinde/Kreis)",
      website: "https://www.service.bund.de (search by Gemeinde)",
      hours: "Typically Mon–Fri 08:00–15:00; appointment booking required",
      waitTime: "Online appointment: 2–12 weeks; in-person queue: 3–8 hours in major cities",
    },
    {
      id: "de-inst-jobcenter",
      name: "Jobcenter (Federal Employment Agency — Benefits Office)",
      type: "federal-agency",
      jurisdiction: "DE",
      phone: "+49 800 4 5555 00 (free hotline)",
      website: "https://www.arbeitsagentur.de/jobcenter",
      hours: "Mon–Fri 08:00–18:00 (hotline); office hours vary by location",
      waitTime: "Phone: 5–30 minutes; in-person appointment: 1–3 weeks",
    },
    {
      id: "de-inst-sozialamt",
      name: "Sozialamt (Social Welfare Office)",
      type: "municipal-office",
      jurisdiction: "DE",
      address: "Located in municipal Rathaus or standalone office",
      website: "https://www.service.bund.de",
      hours: "Varies by municipality; typically Mon–Fri 08:00–16:00",
      waitTime: "Appointment wait: 1–4 weeks",
    },
    {
      id: "de-inst-pro-asyl",
      name: "PRO ASYL e.V. (Refugee Rights NGO)",
      type: "ngo",
      jurisdiction: "DE",
      address: "Postfach 160624, 60069 Frankfurt am Main",
      phone: "+49 69 24 23 14-0",
      website: "https://www.proasyl.de",
      hours: "Mon–Fri 09:00–17:00",
      waitTime: "Phone advice: same-day callback possible; legal referral: 1–2 weeks",
    },
    {
      id: "de-inst-verwaltungsgericht",
      name: "Verwaltungsgericht (Administrative Court)",
      type: "court",
      jurisdiction: "DE",
      website: "https://www.verwaltungsgerichtsbarkeit.de",
      hours: "Mon–Fri 09:00–16:00 (filing); hearings by schedule",
      waitTime: "Case scheduling for asylum appeals: 6 months–2 years (varies by court)",
    },
  ],

  // -------------------------------------------------------------------------
  // Rights
  // -------------------------------------------------------------------------
  rights: [
    {
      id: "de-right-non-refoulement",
      title: "Right to Non-Refoulement",
      description:
        "No person may be returned to a country where they face a real risk of persecution, torture, " +
        "inhuman or degrading treatment, or the death penalty. This right is absolute and cannot be " +
        "overridden even during expedited or manifestly unfounded procedures.",
      domain: "refugee-integration",
      legalBasis:
        "1951 Geneva Refugee Convention, Art. 33; EU Qualification Directive 2011/95/EU; " +
        "German Basic Law (GG) Art. 16a; AsylG § 3 and §4; AufenthG § 60",
    },
    {
      id: "de-right-legal-representation",
      title: "Right to Legal Representation in Asylum Proceedings",
      description:
        "Asylum seekers have the right to legal representation at their own cost at all stages " +
        "of the procedure. Legal aid (Beratungshilfe/Prozesskostenhilfe) is available for those " +
        "without means. NGO and publicly funded counselling is available free of charge.",
      domain: "legal",
      legalBasis:
        "AsylG § 25 Abs. 6; ZPO § 114 (Prozesskostenhilfe); EU Asylum Procedures Directive 2013/32/EU Art. 20–23",
      appealDeadline:
        "Appeals must be filed within 1 month (standard) or 2 weeks (manifestly unfounded) of decision delivery",
    },
    {
      id: "de-right-interpreter",
      title: "Right to an Interpreter in Asylum Proceedings",
      description:
        "BAMF must provide a qualified interpreter at all stages of the asylum procedure, " +
        "including the Anhörung. The interpreter must be competent in the applicant's language and dialect. " +
        "Applicants may request a replacement interpreter if there are concerns about impartiality.",
      domain: "refugee-integration",
      legalBasis:
        "AsylG § 17; EU Asylum Procedures Directive 2013/32/EU Art. 12; Administrative Procedure Act (VwVfG) § 23",
    },
    {
      id: "de-right-subsistence",
      title: "Right to Basic Subsistence Support",
      description:
        "Asylum seekers are entitled to basic subsistence benefits under the Asylbewerberleistungsgesetz (AsylbLG), " +
        "covering accommodation, food, healthcare, and a personal needs allowance (Taschengeld). " +
        "After 18 months this transitions to standard SGB XII (social assistance) rates.",
      domain: "social-protection",
      legalBasis:
        "AsylbLG §§ 1–3; German Basic Law Art. 1 (human dignity); Federal Constitutional Court ruling BVerfG 1 BvL 10/10 (2012)",
    },
    {
      id: "de-right-appeal",
      title: "Right to Appeal an Asylum Decision",
      description:
        "Every asylum applicant has the right to appeal a negative BAMF decision before the competent " +
        "Verwaltungsgericht. The appeal must be accompanied by a request for aufschiebende Wirkung " +
        "(suspensory effect) to prevent removal during proceedings.",
      domain: "legal",
      legalBasis:
        "AsylG §§ 74–83; VwGO § 80 Abs. 5 (suspensory effect application); EU Asylum Procedures Directive Art. 46",
      appealDeadline:
        "1 month (standard rejection); 2 weeks (manifestly unfounded); 1 week (safe third country)",
    },
    {
      id: "de-right-schooling",
      title: "Right to Education and School Access",
      description:
        "All children residing in Germany are subject to compulsory schooling (Schulpflicht) regardless of " +
        "residence status. Asylum seeker children must be enrolled in a school within 3 months of arrival. " +
        "Adults have the right to access integration courses funded by BAMF.",
      domain: "education",
      legalBasis:
        "State (Länder) school compulsory attendance laws; KMK agreement on schooling for refugee children (2015); " +
        "EU Reception Conditions Directive 2013/33/EU Art. 14",
    },
  ],
};
