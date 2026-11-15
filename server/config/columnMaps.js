export const HUGGING_FACE_COLUMN_MAP = {
  name: ["name", "scheme_name", "title", "scheme_title", "scheme"],
  slug: ["slug", "scheme_slug", "scheme_id"],
  ministry: [
    "ministry",
    "ministry_name",
    "department",
    "department_name",
    "sponsoring_ministry"
  ],
  level: ["level", "scheme_level", "government_level", "govt_level"],
  state: [
    "state",
    "state_name",
    "applicable_state",
    "state_ut",
    "state/ut"
  ],
  category: ["scheme_category", "category", "sector", "scheme_type"],
  description: [
    "description",
    "scheme_description",
    "scheme_details",
    "details",
    "summary"
  ],
  benefits: [
    "benefits",
    "benefit",
    "scheme_benefits",
    "key_benefit",
    "benefit_details"
  ],
  eligibilityText: [
    "eligibility_text",
    "eligibility",
    "eligibility_criteria",
    "target_beneficiaries",
    "who_can_apply"
  ],
  documents: [
    "documents",
    "required_documents",
    "document_list",
    "documents_required"
  ],
  howToApply: [
    "how_to_apply",
    "application_process",
    "apply_process",
    "application_procedure"
  ],
  officialLink: [
    "official_link",
    "official_url",
    "scheme_url",
    "application_url",
    "website",
    "url",
    "web_link",
    "scheme_website"
  ],
  sourceUrl: ["source_url", "source", "dataset_url", "reference_url"],
  note: ["note", "notes", "verification_note"],
  eligibility: {
    minAge: [
      "min_age",
      "minimum_age",
      "age_minimum",
      "age_from",
      "eligibility.minAge"
    ],
    maxAge: [
      "max_age",
      "maximum_age",
      "age_maximum",
      "age_to",
      "eligibility.maxAge"
    ],
    gender: [
      "eligible_gender",
      "gender_eligibility",
      "gender",
      "eligibility.gender"
    ],
    category: [
      "caste_category",
      "social_category",
      "eligible_category",
      "beneficiary_category",
      "eligibility.category"
    ],
    occupation: [
      "eligible_occupation",
      "occupation_type",
      "beneficiary_type",
      "eligibility.occupation"
    ],
    maxIncome: [
      "max_income",
      "income_limit",
      "annual_income_limit",
      "family_income_limit",
      "eligibility.maxIncome"
    ],
    area: [
      "area",
      "rural_urban",
      "eligible_area",
      "geographical_area",
      "eligibility.area"
    ],
    requiresLand: [
      "requires_land",
      "land_required",
      "land_ownership",
      "eligibility.requiresLand"
    ],
    requiresBPL: ["requires_bpl", "bpl_required", "eligibility.requiresBPL"],
    disability: [
      "disability",
      "requires_disability",
      "eligibility.disability"
    ]
  }
};

export const DATA_GOV_COLUMN_MAP = {
  ...HUGGING_FACE_COLUMN_MAP,
  ministry: [
    "ministry_department",
    "ministry",
    "ministry_name",
    "department",
    "department_name"
  ],
  officialLink: [
    "official_link",
    "official_url",
    "scheme_url",
    "application_url",
    "website",
    "url",
    "web_link"
  ]
};
