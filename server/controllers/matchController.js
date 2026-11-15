import Scheme from "../models/Scheme.js";
import { matchSchemes } from "../utils/matchSchemes.js";

export async function matchEligibleSchemes(req, res) {
  const answers = res.locals.validated.body;
  const schemes = await Scheme.find({}).lean();
  return res.json(matchSchemes(schemes, answers));
}
