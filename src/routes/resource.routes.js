import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {
  uploadResource,
  getResources,
  getResourcesByType,
  deleteResource
} from "../controllers/resource.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/upload", verifyJWT, upload.single("file"), uploadResource);
router.get('/:teamId', verifyJWT, getResources);
router.get('/:teamId/:filetype', verifyJWT, getResourcesByType);
router.delete('/:resourceId', verifyJWT, deleteResource);

export default router;
