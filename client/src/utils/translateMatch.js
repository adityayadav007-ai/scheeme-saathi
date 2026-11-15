const criterionKeys = {
  Age: "age",
  Gender: "gender",
  Category: "category",
  Occupation: "occupation",
  Area: "area",
  Income: "income",
  "Land ownership": "landOwnership",
  "BPL status": "bplStatus",
  "Disability status": "disabilityStatus"
};

const reasonKeys = {
  "Eligibility needs to be confirmed on the official website":
    "needsConfirmation",
  "Age is required to confirm eligibility": "ageMissing",
  "Gender is required to confirm eligibility": "genderMissing",
  "Category is required to confirm eligibility": "categoryMissing",
  "Occupation is required to confirm eligibility": "occupationMissing",
  "Area is required to confirm eligibility": "areaMissing",
  "Income is required to confirm eligibility": "incomeMissing",
  "Land ownership is required to confirm eligibility": "landMissing",
  "BPL status is required to confirm eligibility": "bplMissing",
  "Disability status is required to confirm eligibility": "disabilityMissing",
  "Age does not meet the limit": "ageFailed",
  "Gender does not match": "genderFailed",
  "Category does not match": "categoryFailed",
  "Occupation does not match": "occupationFailed",
  "Area does not match": "areaFailed",
  "Income is above the limit": "incomeFailed",
  "Land ownership does not match": "landFailed",
  "BPL status does not match": "bplFailed",
  "Disability status does not match": "disabilityFailed"
};

export function translateCriterion(t, criterion) {
  const key = criterionKeys[criterion];
  return key ? t(`criteria.${key}`) : criterion;
}

export function translateMatchReason(t, reason) {
  const key = reasonKeys[reason];
  return key ? t(`matchReasons.${key}`) : reason;
}
