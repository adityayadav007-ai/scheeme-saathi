import { Router } from "express";
import { matchEligibleSchemes } from "../controllers/matchController.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { matchBodySchema } from "../validators/schemeValidators.js";

const router = Router();

router.post(
  "/",
  validateRequest({ body: matchBodySchema }),
  asyncHandler(matchEligibleSchemes)
);

export default router;
