import Post from '../models/post.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const createPost = asyncHandler(async (req, res) => {
  const { title, description, teamId, link } = req.body;

  if (!title || !description || !teamId) {
    throw new ApiError(400, 'Title, description, and team ID are required.');
  }

  const post = new Post({
    title,
    description,
    user: req.user._id,
    team: teamId,
    link: link || null,
  });

  await post.save();

  res.status(201).json(new ApiResponse(201, post, 'Post created successfully.'));
});

export const getPostsByTeam = asyncHandler(async (req, res) => {
  const { teamId } = req.params;

  if (!teamId) {
    throw new ApiError(400, 'Team ID is required.');
  }

  const posts = await Post.find({ team: teamId }).populate('user', 'username email fullName');

  res.status(200).json(new ApiResponse(200, posts, 'Posts fetched successfully.'));
});

export const getPostDetails = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const post = await Post.findById(postId).populate('user', 'username email fullName').populate('team', 'name code');

  if (!post) {
    throw new ApiError(404, 'Post not found.');
  }

  res.status(200).json(new ApiResponse(200, post, 'Post details fetched successfully.'));
});

export const updatePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { title, description, link } = req.body;

  const post = await Post.findById(postId);

  if (!post) {
    throw new ApiError(404, 'Post not found.');
  }

  if (!post.user.equals(req.user._id)) {
    throw new ApiError(403, 'You do not have permission to update this post.');
  }

  post.title = title || post.title;
  post.description = description || post.description;
  post.link = link || post.link;

  await post.save();

  res.status(200).json(new ApiResponse(200, post, 'Post updated successfully.'));
});

export const deletePost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
  
    const post = await Post.findById(postId);
  
    if (!post) {
      throw new ApiError(404, 'Post not found.');
    }
  
    
  
    if (!post.user.equals(req.user._id) && !req.user.team.includes(post.team)) {
      throw new ApiError(403, 'You do not have permission to delete this post.');
    }
  
    await Post.findByIdAndDelete(postId);
  
    res.status(200).json(new ApiResponse(200, {}, 'Post deleted successfully.'));
  });

export const likePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const post = await Post.findById(postId);

  if (!post) {
    throw new ApiError(404, 'Post not found.');
  }

  if (post.likes.includes(req.user._id)) {
    throw new ApiError(400, 'You already liked this post.');
  }

  post.likes.push(req.user._id);
  await post.save();

  res.status(200).json(new ApiResponse(200, post, 'Post liked successfully.'));
});

export const unlikePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const post = await Post.findById(postId);

  if (!post) {
    throw new ApiError(404, 'Post not found.');
  }

  if (!post.likes.includes(req.user._id)) {
    throw new ApiError(400, 'You have not liked this post.');
  }

  post.likes = post.likes.filter(like => !like.equals(req.user._id));
  await post.save();

  res.status(200).json(new ApiResponse(200, post, 'Post unliked successfully.'));
});
