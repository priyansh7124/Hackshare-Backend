import Router from "express";
import {
  addPost,
  addComment,
  likePost,
  getPostById,
  deletePost,
  deleteComment,
  getPostsPaginated
} from "../controllers/communityPost.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/create-post", verifyJWT, addPost);
router.post("/:postId/comments", verifyJWT, addComment);
router.post("/:postId/like", verifyJWT, likePost);
router.get("/get-all", verifyJWT, getPostsPaginated);
router.get("/get-one/:postId", verifyJWT, getPostById);
router.delete("/delete/:postId", verifyJWT, deletePost);
router.delete("/delete/comment/:postId/:commentId", verifyJWT, deleteComment);

export default router;
