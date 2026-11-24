import mongoose from "mongoose";

export const schemeCategories = [
  "Agriculture",
  "Health",
  "Education",
  "Housing",
  "Employment",
  "Women",
  "Senior Citizens",
  "Business",
  "Other"
];

export const supportedLanguages = [
  "en",
  "hi",
  "mr",
  "bn",
  "ta",
  "te",
  "gu",
  "kn",
  "ml",
  "pa",
  "ur"
];

const translationSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    description: { type: String, default: "" },
    benefits: { type: String, default: "" },
    eligibilityText: { type: String, default: "" },
    howToApply: { type: String, default: "" }
  },
  { _id: false }
);

const eligibilitySchema = new mongoose.Schema(
  {
    minAge: { type: Number, default: null },
    maxAge: { type: Number, default: null },
    gender: { type: [String], default: [] },
    category: { type: [String], default: [] },
    occupation: { type: [String], default: [] },
    maxIncome: { type: Number, default: null },
    area: { type: [String], default: [] },
    requiresLand: { type: Boolean, default: null },
    requiresBPL: { type: Boolean, default: null },
    disability: { type: Boolean, default: null }
  },
  { _id: false }
);

const schemeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true },
  ministry: { type: String, default: "" },
  level: { type: String, enum: ["Central", "State"], default: "Central" },
  state: { type: String, default: "All" },
  category: { type: String, enum: schemeCategories, default: "Other" },
  description: { type: String, default: "" },
  benefits: { type: String, default: "" },
  eligibilityText: { type: String, default: "" },
  eligibility: { type: eligibilitySchema, default: () => ({}) },
  documents: { type: [String], default: [] },
  keywords: { type: [String], default: [] },
  howToApply: { type: String, default: "" },
  translations: {
    type: Map,
    of: translationSchema,
    default: () => new Map()
  },
  officialLink: { type: String, required: true, trim: true },
  sourceUrl: { type: String, default: "" },
  note: { type: String, default: "" },
  dataSource: {
    type: String,
    enum: ["seed", "datagov", "huggingface", "import"],
    default: "seed"
  },
  sourceFields: {
    type: Map,
    of: String,
    default: () => new Map(),
    select: false
  },
  verified: { type: Boolean, default: false },
  needsReview: { type: Boolean, default: false },
  lastSyncedAt: { type: Date, default: null },
  linkStatus: {
    type: String,
    enum: ["ok", "broken", "unknown"],
    default: "unknown"
  },
  linkCheckedAt: { type: Date, default: null }
});

schemeSchema.index({ name: "text", description: "text" });
schemeSchema.index({ state: 1 });
schemeSchema.index({ category: 1 });

const Scheme =
  mongoose.models.Scheme || mongoose.model("Scheme", schemeSchema);

export default Scheme;
