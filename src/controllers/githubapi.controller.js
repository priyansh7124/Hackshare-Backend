import { extractOwnerAndRepo } from "../utils/githubUrl.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import axios from "axios";

const fetchCommits = asyncHandler(async (req, res) => {
  const { repoUrl } = req.query;

  if (!repoUrl) {
    throw new ApiError(400, "Repository URL is required");
  }

  try {
    const { owner, repoName } = extractOwnerAndRepo(repoUrl);

    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repoName}/commits`
    );
    res
      .status(200)
      .json(
        new ApiResponse(200, response.data, "Commits fetched successfully")
      );
  } catch (error) {
    throw new ApiError(500, "Something went wrong while fetching commits");
  }
});

const fetchPullRequests = asyncHandler(async (req, res) => {
  const { repoUrl } = req.query;

  if (!repoUrl) {
    throw new ApiError(400, "Repository URL is required");
  }

  try {
    const { owner, repoName } = extractOwnerAndRepo(repoUrl);

    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repoName}/pulls`
    );
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          response.data,
          "Pull requests fetched successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while fetching pull requests"
    );
  }
});

const fetchRepoStats = asyncHandler(async (req, res) => {
    const { repoUrl } = req.query;

    if (!repoUrl) {
        throw new ApiError(400, "Repository URL is required");
    }

    try {
        const { owner, repoName } = extractOwnerAndRepo(repoUrl);

        // Make all API calls concurrently
        const [
            repoInfo,
            branches,
            contributors,
            issues,
            pullRequests,
            commits
        ] = await Promise.all([
            axios.get(`https://api.github.com/repos/${owner}/${repoName}`),
            axios.get(`https://api.github.com/repos/${owner}/${repoName}/branches`),
            axios.get(`https://api.github.com/repos/${owner}/${repoName}/contributors`),
            axios.get(`https://api.github.com/repos/${owner}/${repoName}/issues`),
            axios.get(`https://api.github.com/repos/${owner}/${repoName}/pulls`),
            axios.get(`https://api.github.com/repos/${owner}/${repoName}/commits`)
        ]);

        const response = {
            repository: repoInfo.data,
            branches: branches.data,
            contributors: contributors.data,
            issues: issues.data,
            pullRequests: pullRequests.data,
            commits: commits.data
        };

        res.status(200).json(new ApiResponse(200, response, "Repository statistics fetched successfully"));
    } catch (error) {
        throw new ApiError(500, error.message || "Something went wrong while fetching repository statistics");
    }
});

export { fetchCommits, fetchPullRequests , fetchRepoStats };
