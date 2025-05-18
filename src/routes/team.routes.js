import { Router } from "express";
import {
    createTeam,
    joinTeam,
    manageMembers,
    getTeams,
    deleteTeam,
    getTeamDetails,
    addGithubRepo,
    leaveTeam,
    deleteGithubRepo
} from "../controllers/team.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/create-team", verifyJWT, createTeam);
router.post("/join-team", verifyJWT, joinTeam);
router.post("/manage-team", verifyJWT, manageMembers);
router.post("/addrepo", verifyJWT, addGithubRepo);
router.get("/getallteams", verifyJWT, getTeams);
router.get("/:teamId", verifyJWT, getTeamDetails);
router.delete("/delete/:teamId", verifyJWT, deleteTeam);
router.delete("/deleteGithubRepo", verifyJWT,deleteGithubRepo);
router.post("/leave/:teamId", verifyJWT, leaveTeam);

export default router;
