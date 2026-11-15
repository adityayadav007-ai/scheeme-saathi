const confirmedEligibilityReason =
  "Eligibility needs to be confirmed on the official website";

const criteriaLabels = {
  age: "Age",
  gender: "Gender",
  category: "Category",
  occupation: "Occupation",
  area: "Area",
  income: "Income",
  ownsLand: "Land ownership",
  bpl: "BPL status",
  disability: "Disability status"
};

function isUnrestricted(value) {
  return (
    value === null ||
    value === undefined ||
    value === "" ||
    (Array.isArray(value) &&
      (value.length === 0 ||
        value.some((entry) => String(entry).trim().toLowerCase() === "any"))) ||
    (typeof value === "string" && value.trim().toLowerCase() === "any")
  );
}

function matchesList(restriction, answer) {
  if (isUnrestricted(restriction)) return true;
  if (answer === null || answer === undefined) return false;
  const normalizedAnswer = String(answer).trim().toLowerCase();
  return restriction.some(
    (value) => String(value).trim().toLowerCase() === normalizedAnswer
  );
}

function activeCriteria(eligibility = {}) {
  const checks = [];
  const ageRestricted =
    !isUnrestricted(eligibility.minAge) ||
    !isUnrestricted(eligibility.maxAge);
  if (ageRestricted) {
    checks.push({
      key: "age",
      pass:
        userAge =>
          userAge !== null &&
          userAge !== undefined &&
          (isUnrestricted(eligibility.minAge) ||
            userAge >= eligibility.minAge) &&
          (isUnrestricted(eligibility.maxAge) ||
            userAge <= eligibility.maxAge),
      missingAnswer: "Age is required to confirm eligibility",
      failedReason: "Age does not meet the limit"
    });
  }

  const listCriteria = [
    ["gender", eligibility.gender, "Gender does not match"],
    ["category", eligibility.category, "Category does not match"],
    ["occupation", eligibility.occupation, "Occupation does not match"],
    ["area", eligibility.area, "Area does not match"]
  ];
  for (const [key, restriction, failedReason] of listCriteria) {
    if (isUnrestricted(restriction)) continue;
    checks.push({
      key,
      pass: (answer) => matchesList(restriction, answer),
      missingAnswer: `${criteriaLabels[key]} is required to confirm eligibility`,
      failedReason
    });
  }

  if (!isUnrestricted(eligibility.maxIncome)) {
    checks.push({
      key: "income",
      pass: (income) => income !== null && income !== undefined &&
        income <= eligibility.maxIncome,
      missingAnswer: "Income is required to confirm eligibility",
      failedReason: "Income is above the limit"
    });
  }

  const booleanCriteria = [
    ["ownsLand", eligibility.requiresLand, "Land ownership does not match"],
    ["bpl", eligibility.requiresBPL, "BPL status does not match"],
    ["disability", eligibility.disability, "Disability status does not match"]
  ];
  for (const [key, restriction, failedReason] of booleanCriteria) {
    if (isUnrestricted(restriction)) continue;
    checks.push({
      key,
      pass: (answer) => answer !== null && answer !== undefined &&
        answer === restriction,
      missingAnswer: `${criteriaLabels[key]} is required to confirm eligibility`,
      failedReason
    });
  }

  return checks;
}

function criterionAnswer(key, answers) {
  return {
    age: answers.age,
    gender: answers.gender,
    category: answers.category,
    occupation: answers.occupation,
    area: answers.area,
    income: answers.income,
    ownsLand: answers.ownsLand,
    bpl: answers.bpl,
    disability: answers.disability
  }[key];
}

function compareNames(left, right) {
  return String(left.name ?? "").localeCompare(String(right.name ?? ""), "en", {
    sensitivity: "base"
  });
}

export function matchSchemes(schemes, answers) {
  const eligible = [];
  const partial = [];

  for (const scheme of schemes) {
    if (
      scheme.state &&
      scheme.state !== "All" &&
      (!answers.state ||
        scheme.state.trim().toLowerCase() !== answers.state.trim().toLowerCase())
    ) {
      continue;
    }

    const checks = activeCriteria(scheme.eligibility);
    const matchedOn = [];
    const failures = [];

    for (const check of checks) {
      const answer = criterionAnswer(check.key, answers);
      if (check.pass(answer)) {
        matchedOn.push(criteriaLabels[check.key]);
      } else {
        failures.push(
          answer === null || answer === undefined
            ? check.missingAnswer
            : check.failedReason
        );
      }
    }

    if (!scheme.verified || scheme.needsReview || checks.length < 3) {
      partial.push({
        ...scheme,
        matchedOn,
        failedReason: confirmedEligibilityReason
      });
    } else if (failures.length === 0) {
      eligible.push({ ...scheme, matchedOn });
    } else if (failures.length === 1) {
      partial.push({
        ...scheme,
        matchedOn,
        failedReason: failures[0]
      });
    }
  }

  eligible.sort((left, right) =>
    Number(Boolean(left.needsReview)) - Number(Boolean(right.needsReview)) ||
    compareNames(left, right)
  );

  return { eligible, partial };
}
