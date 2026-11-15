import { z } from "zod";
import { indianStates } from "../config/indianStates.js";

const categories = [
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

const states = z.enum(indianStates);
const optionalAnswer = (schema) => schema.nullable().optional();

export const listSchemesQuerySchema = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  category: z.enum(categories).optional(),
  state: states.optional(),
  level: z.enum(["Central", "State"]).optional(),
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12)
}).strict();

export const schemeSlugParamsSchema = z.object({
  slug: z.string().trim().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
}).strict();

export const matchBodySchema = z.object({
  age: optionalAnswer(z.number().int().min(0).max(120)),
  gender: optionalAnswer(z.enum(["female", "male", "other"])),
  state: optionalAnswer(states),
  area: optionalAnswer(z.enum(["Rural", "Urban"])),
  income: optionalAnswer(z.number().finite().min(0)),
  category: optionalAnswer(z.enum(["General", "OBC", "SC", "ST", "EWS"])),
  occupation: optionalAnswer(z.enum([
    "farmer",
    "street vendor",
    "artisan",
    "student",
    "fisher",
    "construction worker",
    "self-employed",
    "unorganised worker",
    "salaried",
    "unemployed",
    "other"
  ])),
  education: optionalAnswer(z.enum([
    "no formal education",
    "primary",
    "secondary",
    "higher secondary",
    "graduate",
    "postgraduate",
    "professional"
  ])),
  disability: optionalAnswer(z.boolean()),
  maritalStatus: optionalAnswer(z.enum([
    "unmarried",
    "married",
    "widowed",
    "divorced",
    "separated"
  ])),
  ownsLand: optionalAnswer(z.boolean()),
  bpl: optionalAnswer(z.boolean())
}).strict();
