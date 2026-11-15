import { describe, expect, test } from "vitest";
import { matchSchemes } from "../utils/matchSchemes.js";

const answers = {
  age: 30,
  gender: "female",
  state: "Maharashtra",
  area: "Rural",
  income: 100_000,
  category: "OBC",
  occupation: "farmer",
  disability: false,
  ownsLand: true,
  bpl: false
};

function scheme(overrides = {}) {
  return {
    name: "Test Scheme",
    slug: "test-scheme",
    state: "All",
    verified: true,
    needsReview: false,
    eligibility: {
      minAge: 18,
      maxAge: 60,
      gender: ["female"],
      category: ["OBC"],
      occupation: ["farmer"],
      maxIncome: 200_000,
      area: ["Rural"],
      requiresLand: true,
      requiresBPL: false,
      disability: false
    },
    ...overrides
  };
}

describe("matchSchemes", () => {
  test("returns an eligible scheme and the criteria that matched", () => {
    const result = matchSchemes([scheme()], answers);
    expect(result.eligible).toHaveLength(1);
    expect(result.eligible[0].matchedOn).toContain("Income");
    expect(result.partial).toEqual([]);
  });

  test("returns a one-criterion failure with the specific reason", () => {
    const result = matchSchemes(
      [scheme()],
      { ...answers, income: 250_000 }
    );
    expect(result.eligible).toEqual([]);
    expect(result.partial).toHaveLength(1);
    expect(result.partial[0].failedReason).toBe("Income is above the limit");
  });

  test("skips a scheme assigned to a different state", () => {
    const result = matchSchemes(
      [scheme({ state: "Gujarat" })],
      answers
    );
    expect(result).toEqual({ eligible: [], partial: [] });
  });

  test("puts schemes marked for review in partial results", () => {
    const result = matchSchemes([scheme({ needsReview: true })], answers);
    expect(result.eligible).toEqual([]);
    expect(result.partial[0].failedReason).toBe(
      "Eligibility needs to be confirmed on the official website"
    );
  });

  test("never marks an unverified scheme as eligible", () => {
    const result = matchSchemes([scheme({ verified: false })], answers);
    expect(result.eligible).toEqual([]);
    expect(result.partial).toHaveLength(1);
    expect(result.partial[0].failedReason).toBe(
      "Eligibility needs to be confirmed on the official website"
    );
  });

  test("treats null, empty arrays and any as unrestricted", () => {
    const result = matchSchemes(
      [
        scheme({
          eligibility: {
            minAge: null,
            maxAge: null,
            gender: [],
            category: ["any"],
            occupation: [],
            maxIncome: null,
            area: ["any"],
            requiresLand: null,
            requiresBPL: null,
            disability: null
          }
        })
      ],
      answers
    );
    expect(result.eligible).toEqual([]);
    expect(result.partial[0].failedReason).toBe(
      "Eligibility needs to be confirmed on the official website"
    );
    expect(result.partial[0].matchedOn).toEqual([]);
  });

  test("includes age and income boundary values", () => {
    const boundaryScheme = scheme({
      eligibility: {
        minAge: 30,
        maxAge: 30,
        gender: ["female"],
        category: ["OBC"],
        occupation: ["farmer"],
        maxIncome: 100_000,
        area: ["Rural"],
        requiresLand: true,
        requiresBPL: false,
        disability: false
      }
    });
    expect(matchSchemes([boundaryScheme], answers).eligible).toHaveLength(1);
  });

  test("does not mark a scheme eligible when a restricted answer is missing", () => {
    const result = matchSchemes([scheme()], { ...answers, income: null });
    expect(result.eligible).toEqual([]);
    expect(result.partial[0].failedReason).toBe(
      "Income is required to confirm eligibility"
    );
  });
});
