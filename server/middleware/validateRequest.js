export function validateRequest({ query, params, body }) {
  return (req, res, next) => {
    const parsed = {};
    for (const [part, schema] of Object.entries({ query, params, body })) {
      if (!schema) continue;
      const result = schema.safeParse(req[part]);
      if (!result.success) {
        return next(result.error);
      }
      parsed[part] = result.data;
    }

    res.locals.validated = parsed;
    return next();
  };
}
