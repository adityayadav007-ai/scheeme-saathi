import Scheme from "../models/Scheme.js";
import { localizeScheme } from "./schemeController.js";
import { matchSchemes } from "../utils/matchSchemes.js";

export async function matchEligibleSchemes(req, res) {
  const answers = res.locals.validated.body;
  const { lang } = res.locals.validated.query;
  const schemes = await Scheme.find({}).lean();
  const matches = matchSchemes(schemes, answers);
  return res.json({
    eligible: matches.eligible.map((scheme) => localizeScheme(scheme, lang)),
    partial: matches.partial.map((scheme) => localizeScheme(scheme, lang))
  });
}
