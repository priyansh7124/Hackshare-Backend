import { Router } from "express";
import {
  generateResponse
} from "../controllers/genAi.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/gen-response", generateResponse);

export default router;
