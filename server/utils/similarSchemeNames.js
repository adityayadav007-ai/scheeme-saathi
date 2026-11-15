const genericNameTokens = new Set([
  "india",
  "national",
  "of",
  "for",
  "pradhan",
  "pm",
  "scheme",
  "the",
  "yojana"
]);

function nameTokens(name) {
  return new Set(
    String(name ?? "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 1 && !genericNameTokens.has(token))
  );
}

export function findSimilarSchemeNames(schemes, threshold = 0.75) {
  const candidates = schemes.map((scheme) => ({
    ...scheme,
    tokens: nameTokens(scheme.name)
  }));
  const pairs = [];

  for (let leftIndex = 0; leftIndex < candidates.length; leftIndex += 1) {
    const left = candidates[leftIndex];
    if (left.tokens.size === 0) continue;

    for (
      let rightIndex = leftIndex + 1;
      rightIndex < candidates.length;
      rightIndex += 1
    ) {
      const right = candidates[rightIndex];
      if (
        right.tokens.size === 0 ||
        (left.slug && left.slug === right.slug)
      ) {
        continue;
      }

      let sharedTokens = 0;
      for (const token of left.tokens) {
        if (right.tokens.has(token)) sharedTokens += 1;
      }

      const similarity =
        sharedTokens / Math.min(left.tokens.size, right.tokens.size);
      if (similarity >= threshold) {
        pairs.push({
          first: { name: left.name, slug: left.slug },
          second: { name: right.name, slug: right.slug },
          sharedTokens: [...left.tokens].filter((token) =>
            right.tokens.has(token)
          ),
          similarity: Number(similarity.toFixed(2))
        });
      }
    }
  }

  return pairs;
}
