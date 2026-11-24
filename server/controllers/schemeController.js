import Scheme from "../models/Scheme.js";
import { HttpError } from "../utils/httpError.js";

export function localizeScheme(scheme, language = "en") {
  if (!scheme) return scheme;
  const translations = scheme.translations;
  const localized = translations instanceof Map
    ? translations.get(language)
    : translations?.[language];
  const english = translations instanceof Map
    ? translations.get("en")
    : translations?.en;

  for (const field of [
    "name",
    "description",
    "benefits",
    "eligibilityText",
    "howToApply"
  ]) {
    scheme[field] =
      localized?.[field] || english?.[field] || scheme[field] || "";
  }

  return scheme;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function listSchemes(req, res) {
  const { q, category, state, level, page, limit, lang } =
    res.locals.validated.query;
  const filter = {};

  if (q) {
    const escaped = escapeRegex(q);
    filter.$or = [
      { name: { $regex: escaped, $options: "i" } },
      { description: { $regex: escaped, $options: "i" } },
      { [`translations.${lang}.name`]: { $regex: escaped, $options: "i" } },
      {
        [`translations.${lang}.description`]: {
          $regex: escaped,
          $options: "i"
        }
      }
    ];
  }
  if (category) filter.category = category;
  if (state) filter.state = { $in: [state, "All"] };
  if (level) filter.level = level;

  const [data, total] = await Promise.all([
    Scheme.find(filter)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Scheme.countDocuments(filter)
  ]);

  return res.json({
    data: data.map((scheme) => localizeScheme(scheme, lang)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}

export async function getScheme(req, res) {
  const { slug } = res.locals.validated.params;
  const { lang } = res.locals.validated.query;
  const scheme = await Scheme.findOne({ slug }).lean();
  if (!scheme) throw new HttpError(404, `Scheme "${slug}" was not found`);
  return res.json({ data: localizeScheme(scheme, lang) });
}
