import { Router } from "express";
import {
  fetchCommits,
  fetchPullRequests,
  fetchRepoStats
} from "../controllers/githubapi.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/commits", verifyJWT, fetchCommits);
router.get("/pullRequests", verifyJWT, fetchPullRequests);
router.get('/repoStats', verifyJWT, fetchRepoStats);

export default router;
