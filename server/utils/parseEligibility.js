function parseAge(text) {
  const range = text.match(
    /\b(?:aged?\s+|age\s+(?:of\s+)?|between\s+)?(\d{1,3})\s*(?:to|-|and)\s*(\d{1,3})\s*(?:years?|yrs?)\b/i
  );
  if (range) {
    const first = Number(range[1]);
    const second = Number(range[2]);
    if (first <= second && second <= 120) {
      return { minAge: first, maxAge: second };
    }
  }

  const minimum = text.match(
    /\b(?:minimum(?: age)?|at least|aged?|age(?: of)?)\s*(?:is\s*)?(\d{1,3})\s*(?:years?|yrs?)?\s*(?:and above|or older|or above|and over|\+)?(?!\d)/i
  );
  if (minimum && Number(minimum[1]) <= 120) {
    return { minAge: Number(minimum[1]), maxAge: null };
  }

  const maximum = text.match(
    /\b(?:below|under|up to|maximum(?: age)?|not more than)\s*(\d{1,3})\s*(?:years?|yrs?)?(?!\d)/i
  );
  if (maximum && Number(maximum[1]) <= 120) {
    return { minAge: null, maxAge: Number(maximum[1]) };
  }

  return { minAge: null, maxAge: null };
}

function parseGender(text) {
  const hasWomen = /\b(women|woman|female|girl|girls)\b/i.test(text);
  const hasMen = /\b(men|man|male|boy|boys)\b/i.test(text);
  if (hasWomen === hasMen) return null;
  return hasWomen ? ["female"] : ["male"];
}

function parseIncome(text) {
  const amountPattern =
    "(?:₹\\s*|rs\\.?\\s*)?([\\d,]+(?:\\.\\d+)?)\\s*(crores?|cr|lakhs?|lacs?|lakh|rupees?)?";
  const incomePattern = new RegExp(
    `\\b(?:annual\\s+|family\\s+|household\\s+|gross\\s+)?income\\b[^.;\\n]{0,50}?(?:not exceed(?:ing)?|cannot exceed|should not exceed|shall not exceed|does not exceed|up to|below|less than|maximum|limit(?:ed)?(?: to)?|of|is at most|<=)?\\s*${amountPattern}`,
    "i"
  );
  const match = text.match(incomePattern);
  if (!match) return null;

  const amount = Number(match[1].replace(/,/g, ""));
  if (!Number.isFinite(amount)) return null;
  const unit = (match[2] ?? "").toLowerCase();
  if (unit.startsWith("crore") || unit === "cr") return amount * 10_000_000;
  if (unit.startsWith("lakh") || unit.startsWith("lac")) return amount * 100_000;
  return amount;
}

function parseCategory(text) {
  const categoryRules = [
    ["SC", /\b(?:scheduled caste|sc)\b/i],
    ["ST", /\b(?:scheduled tribe|scheduled tribes|st)\b/i],
    ["OBC", /\b(?:other backward classes?|obc)\b/i],
    ["EWS", /\b(?:economically weaker sections?|ews)\b/i],
    ["General", /\bgeneral category\b/i]
  ];
  const found = categoryRules
    .filter(([, pattern]) => pattern.test(text))
    .map(([category]) => category);
  return found.length ? [...new Set(found)] : null;
}

function parseOccupation(text) {
  const occupationRules = [
    ["farmer", /\b(farmers?|cultivators?)\b/i],
    ["street vendor", /\b(street vendors?|hawkers?)\b/i],
    ["artisan", /\b(artisans?|craftspeople|traditional craftspeople)\b/i],
    ["student", /\b(students?|scholars?)\b/i],
    ["fisher", /\b(fishers?|fishermen|fishworkers?)\b/i],
    ["construction worker", /\b(construction workers?|building workers?)\b/i],
    ["self-employed", /\bself[- ]employed\b/i],
    ["unorganised worker", /\bunorganised workers?\b/i]
  ];
  const found = occupationRules
    .filter(([, pattern]) => pattern.test(text))
    .map(([occupation]) => occupation);
  return found.length ? [...new Set(found)] : null;
}

function parseArea(text) {
  const hasRural = /\b(rural|village|villages)\b/i.test(text);
  const hasUrban = /\b(urban|city|cities|town|towns)\b/i.test(text);
  if (!hasRural && !hasUrban) return null;
  return [
    ...(hasRural ? ["Rural"] : []),
    ...(hasUrban ? ["Urban"] : [])
  ];
}

export function parseEligibility(value) {
  const eligibilityText = typeof value === "string" ? value.trim() : "";

  if (!eligibilityText) {
    return {
      eligibilityText,
      eligibility: {
        minAge: null,
        maxAge: null,
        gender: null,
        category: null,
        occupation: null,
        maxIncome: null,
        area: null,
        requiresLand: null,
        requiresBPL: null,
        disability: null
      }
    };
  }

  const age = parseAge(eligibilityText);
  return {
    eligibilityText,
    eligibility: {
      ...age,
      gender: parseGender(eligibilityText),
      category: parseCategory(eligibilityText),
      occupation: parseOccupation(eligibilityText),
      maxIncome: parseIncome(eligibilityText),
      area: parseArea(eligibilityText),
      requiresLand: null,
      requiresBPL: null,
      disability: null
    }
  };
}
