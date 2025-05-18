import { CommunityPost } from '../models/communityPost.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// Add a new post
const addPost = asyncHandler(async (req, res) => {
    const { title, content, tags } = req.body;

    if (!title || !content) {
        throw new ApiError(400, "Title and content are required");
    }

    const post = new CommunityPost({
        user: req.user._id,
        title,
        content,
        tags
    });

    await post.save();
    res.status(201).json(new ApiResponse(201, post, "Post created successfully"));
});

// Comment on a post
const addComment = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;

    if (!content) {
        throw new ApiError(400, "Content is required");
    }

    const post = await CommunityPost.findById(postId);

    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    post.comments.push({ user: req.user._id, content });
    await post.save();
    res.status(201).json(new ApiResponse(201, post, "Comment added successfully"));
});

// Like or unlike a post
const likePost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const post = await CommunityPost.findById(postId);

    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    const index = post.likes.indexOf(req.user._id);

    if (index === -1) {
        post.likes.push(req.user._id);
    } else {
        post.likes.splice(index, 1);
    }

    await post.save();
    res.status(200).json(new ApiResponse(200, post, "Post liked/unliked successfully"));
});

// Get posts with filtering by tags and paginated
const getPostsPaginated = asyncHandler(async (req, res) => {
    const { tags, page = 1, limit = 10 } = req.query;

    const filter = tags ? { tags: { $in: tags.split(',') } } : {};

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const posts = await CommunityPost.find(filter)
        .populate('user', 'profilePicture username')
        .populate('comments.user', 'username')
        .sort({ createdAt: -1 }) // Sort by latest first
        .skip(skip)
        .limit(limitNumber);
    const totalPosts = await CommunityPost.countDocuments(filter);

    res.status(200).json(new ApiResponse(200, {
        posts,
        pagination: {
            currentPage: pageNumber,
            totalPages: Math.ceil(totalPosts / limitNumber),
            totalPosts
        }
    }, "Posts fetched successfully"));
});


// Get a single post by ID
const getPostById = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const post = await CommunityPost.findById(postId).populate('user', 'username profilePicture').populate('comments.user', 'username' ,);

    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    res.status(200).json(new ApiResponse(200, post, "Post fetched successfully"));
});

// Delete a post
const deletePost = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    const post = await CommunityPost.findById(postId);

    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    if (!post.user.equals(req.user._id)) {
        throw new ApiError(403, "You are not authorized to delete this post");
    }

    await CommunityPost.findByIdAndDelete(postId);
    res.status(200).json(new ApiResponse(200, {}, "Post deleted successfully"));
});

// Delete a comment
const deleteComment = asyncHandler(async (req, res) => {
    const { postId, commentId } = req.params;

    const post = await CommunityPost.findById(postId);

    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    const comment = post.comments.id(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (!comment.user.equals(req.user._id)) {
        throw new ApiError(403, "You are not authorized to delete this comment");
    }

    await CommunityPost.findByIdAndUpdate(
        postId,
        { $pull: { comments: { _id: commentId } } },
        { new: true }
    );

    res.status(200).json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

export {
    addPost,
    addComment,
    likePost,
    getPostsPaginated,
    getPostById,
    deletePost,
    deleteComment
};