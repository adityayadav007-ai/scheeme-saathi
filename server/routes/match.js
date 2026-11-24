import { Router } from "express";
import { matchEligibleSchemes } from "../controllers/matchController.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  matchBodySchema,
  schemeLanguageQuerySchema
} from "../validators/schemeValidators.js";

const router = Router();

router.post(
  "/",
  validateRequest({
    body: matchBodySchema,
    query: schemeLanguageQuerySchema
  }),
  asyncHandler(matchEligibleSchemes)
);

export default router;
