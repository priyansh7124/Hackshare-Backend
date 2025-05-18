import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  uploadProfilePicture,
  deleteProfilePicture,
  uploadCoverPicture,
  deleteCoverPicture,
  updateSocials
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);

//secured routes
router.route("/logout").get(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-account").patch(verifyJWT, updateAccountDetails)
router.route("/upload-profile-picture").post(verifyJWT, upload.single('profilePicture'), uploadProfilePicture);
router.route("/delete-profile-picture").delete(verifyJWT, deleteProfilePicture);
router.route("/upload-cover-picture").post(verifyJWT, upload.single('coverPicture'), uploadCoverPicture);
router.route("/delete-cover-picture").delete(verifyJWT, deleteCoverPicture);
router.route("/socials").post(verifyJWT,updateSocials);


export default router;
