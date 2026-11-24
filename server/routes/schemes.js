import { Router } from "express";
import { getScheme, listSchemes } from "../controllers/schemeController.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  listSchemesQuerySchema,
  schemeLanguageQuerySchema,
  schemeSlugParamsSchema
} from "../validators/schemeValidators.js";

const router = Router();

router.get(
  "/",
  validateRequest({ query: listSchemesQuerySchema }),
  asyncHandler(listSchemes)
);
router.get(
  "/:slug",
  validateRequest({
    params: schemeSlugParamsSchema,
    query: schemeLanguageQuerySchema
  }),
  asyncHandler(getScheme)
);

export default router;
