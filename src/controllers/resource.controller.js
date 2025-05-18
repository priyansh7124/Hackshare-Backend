import Resource from "../models/resource.model.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const uploadResource = asyncHandler(async (req, res) => {
  const { teamId, filetype, description } = req.body;
  const { file } = req;

  if (!file || !teamId || !filetype) {
    throw new ApiError(400, "File, team ID, and file type are required.");
  }

  if (!["document", "image", "codesnippet", "link"].includes(filetype)) {
    throw new ApiError(400, "Invalid file type.");
  }

  const localFilePath = file.path;

  try {
    const response = await uploadOnCloudinary(localFilePath);
    if (!response) {
      throw new ApiError(500, "File upload failed.");
    }
    

    const newResource = new Resource({
      url: response.url,
      filename: file.originalname,
      description: description || "",
      user: req.user._id,
      team: teamId,
      filetype: filetype,
    });

    await newResource.save();

    res
      .status(201)
      .json(
        new ApiResponse(201, newResource, "Resource uploaded successfully.")
      );
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "An error occurred while uploading the resource."
    );
  }
});

export const getResources = asyncHandler(async (req, res) => {
  const { teamId } = req.params;

  if (!teamId) {
    throw new ApiError(400, "Team ID is required.");
  }

  try {
    const resources = await Resource.find({ team: teamId }).populate(
      "user",
      "username email fullName"
    );

    const segregatedResources = {
      documents: resources.filter(
        (resource) => resource.filetype === "document"
      ),
      images: resources.filter((resource) => resource.filetype === "image"),
      codesnippets: resources.filter(
        (resource) => resource.filetype === "codesnippet"
      ),
      links: resources.filter((resource) => resource.filetype === "link"),
    };

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          segregatedResources,
          "Resources fetched successfully."
        )
      );
  } catch (error) {
    throw new ApiError(500, "Something went wrong while fetching resources.");
  }
});

export const getResourcesByType = asyncHandler(async (req, res) => {
  const { teamId, filetype } = req.params;

  if (!teamId || !filetype) {
    throw new ApiError(400, "Team ID and file type are required.");
  }

  if (!["document", "image", "codesnippet", "link"].includes(filetype)) {
    throw new ApiError(400, "Invalid file type.");
  }

  try {
    const resources = await Resource.find({ team: teamId, filetype })
  .populate("user", "username email fullName")
  .populate({
    path: "team",
    populate: {
      path: "owner",
      select: "username email fullName",
    },
  });
    res
      .status(200)
      .json(new ApiResponse(200, resources, "Resources fetched successfully."));
  } catch (error) {
    throw new ApiError(500, "Something went wrong while fetching resources.");
  }
});

export const deleteResource = asyncHandler(async (req, res) => {
  const { resourceId } = req.params;

  if (!resourceId) {
    throw new ApiError(400, "Resource ID is required.");
  }

  try {
    const resource = await Resource.findById(resourceId).populate("user", "username email fullName")
    .populate({
      path: "team",
      populate: {
        path: "owner",
        select: "username email fullName",
      },
    });
    if (!resource) {
      throw new ApiError(404, "Resource not found.");
    }
    if (
      !(resource.user.equals(req.user._id) || (resource.team.owner.username==req.user.username) )&&
      !req.user.teams.includes(resource.team)
    ) {
      throw new ApiError(
        403,
        "You do not have permission to delete this resource."
      );
    }

    // Delete from Cloudinary
    await deleteFromCloudinary(resource.url);
    // Delete from MongoDB
    await Resource.findByIdAndDelete(resourceId);

    res
      .status(200)
      .json(new ApiResponse(200, {}, "Resource deleted successfully."));
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "An error occurred while deleting the resource."
    );
  }
});
