import { test } from "vitest";
import assert from "node:assert/strict";
import { parseEligibility } from "../utils/parseEligibility.js";

test("parses a closed age range", () => {
  const { eligibility } = parseEligibility(
    "Applicants aged 18 to 40 years can apply."
  );
  assert.equal(eligibility.minAge, 18);
  assert.equal(eligibility.maxAge, 40);
});

test("parses a minimum age", () => {
  const { eligibility } = parseEligibility(
    "Candidates must be at least 21 years old."
  );
  assert.equal(eligibility.minAge, 21);
  assert.equal(eligibility.maxAge, null);
});

test("parses a maximum age", () => {
  const { eligibility } = parseEligibility(
    "Applicants below 60 years are covered."
  );
  assert.equal(eligibility.minAge, null);
  assert.equal(eligibility.maxAge, 60);
});

test("parses a minimum age expressed with a plus sign", () => {
  const { eligibility } = parseEligibility("Women aged 18+ may apply.");
  assert.equal(eligibility.minAge, 18);
});

test("parses a female-only rule", () => {
  const { eligibility } = parseEligibility("The scheme is for women applicants.");
  assert.deepEqual(eligibility.gender, ["female"]);
});

test("leaves gender unrestricted when the text names men and women", () => {
  const { eligibility } = parseEligibility(
    "Eligible men and women may apply."
  );
  assert.equal(eligibility.gender, null);
});

test("converts an annual lakh income limit to rupees", () => {
  const { eligibility } = parseEligibility(
    "Family income up to Rs. 2 lakh per year is permitted."
  );
  assert.equal(eligibility.maxIncome, 200_000);
});

test("parses a rupee income limit with digit grouping", () => {
  const { eligibility } = parseEligibility(
    "Annual income should not exceed ₹2,50,000."
  );
  assert.equal(eligibility.maxIncome, 250_000);
});

test("parses multiple social categories", () => {
  const { eligibility } = parseEligibility(
    "Applicants from Scheduled Caste and OBC categories may apply."
  );
  assert.deepEqual(eligibility.category, ["SC", "OBC"]);
});

test("parses an economically weaker section category", () => {
  const { eligibility } = parseEligibility(
    "The benefit is available to EWS applicants."
  );
  assert.deepEqual(eligibility.category, ["EWS"]);
});

test("parses street-vendor occupation", () => {
  const { eligibility } = parseEligibility(
    "Eligible street vendors can register."
  );
  assert.deepEqual(eligibility.occupation, ["street vendor"]);
});

test("parses rural-only area", () => {
  const { eligibility } = parseEligibility(
    "The programme applies to households in rural areas."
  );
  assert.deepEqual(eligibility.area, ["Rural"]);
});

test("parses both rural and urban areas", () => {
  const { eligibility } = parseEligibility(
    "Residents of rural and urban areas may apply."
  );
  assert.deepEqual(eligibility.area, ["Rural", "Urban"]);
});

test("preserves the source text and leaves uncertain criteria null", () => {
  const text = "Eligibility is determined by the department.";
  const result = parseEligibility(text);
  assert.equal(result.eligibilityText, text);
  assert.equal(result.eligibility.minAge, null);
  assert.equal(result.eligibility.maxAge, null);
  assert.equal(result.eligibility.gender, null);
  assert.equal(result.eligibility.category, null);
  assert.equal(result.eligibility.occupation, null);
  assert.equal(result.eligibility.maxIncome, null);
  assert.equal(result.eligibility.area, null);
});

test("leaves age unknown when the detected value is outside a plausible range", () => {
  const { eligibility } = parseEligibility("Applicants aged 121 years may apply.");
  assert.equal(eligibility.minAge, null);
  assert.equal(eligibility.maxAge, null);
});

test("keeps all extracted text in eligibilityText", () => {
  const text = "Women in rural areas with family income up to 3 lakh.";
  const result = parseEligibility(text);
  assert.equal(result.eligibilityText, text);
  assert.deepEqual(result.eligibility.gender, ["female"]);
  assert.equal(result.eligibility.maxIncome, 300_000);
});
