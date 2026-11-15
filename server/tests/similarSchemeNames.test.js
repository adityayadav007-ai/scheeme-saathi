import { describe, expect, test } from "vitest";
import { findSimilarSchemeNames } from "../utils/similarSchemeNames.js";

describe("findSimilarSchemeNames", () => {
  test("reports likely name variants for manual review without merging them", () => {
    const schemes = [
      { name: "PM Kisan", slug: "pm-kisan" },
      {
        name: "PM-KISAN Samman Nidhi",
        slug: "pm-kisan-samman-nidhi"
      },
      { name: "Atal Pension Yojana", slug: "atal-pension-yojana" }
    ];

    expect(findSimilarSchemeNames(schemes)).toEqual([
      {
        first: { name: "PM Kisan", slug: "pm-kisan" },
        second: {
          name: "PM-KISAN Samman Nidhi",
          slug: "pm-kisan-samman-nidhi"
        },
        sharedTokens: ["kisan"],
        similarity: 1
      }
    ]);
    expect(schemes).toHaveLength(3);
  });
});
