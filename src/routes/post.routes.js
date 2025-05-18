import { Router } from "express";
import {
  createPost,
  getPostsByTeam,
  getPostDetails,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
} from "../controllers/post.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post('/create-post', verifyJWT, createPost);
router.get('/getpostbyteams/:teamId', verifyJWT, getPostsByTeam);
router.get('/:postId', verifyJWT, getPostDetails);
router.put('/:postId', verifyJWT, updatePost);
router.delete('/:postId', verifyJWT, deletePost);
router.post('/:postId/like', verifyJWT, likePost);
router.post('/:postId/unlike', verifyJWT, unlikePost);

export default router;
