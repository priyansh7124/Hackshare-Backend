import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import fs from "fs";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  const user = await User.create({
    fullName,
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const accessTokenExpiryDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 1 day
  const refreshTokenExpiryDate = new Date(
    Date.now() + 10 * 24 * 60 * 60 * 1000
  ); // 10 days

  const accessOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    expires: accessTokenExpiryDate,
  };

  const refreshOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    expires: refreshTokenExpiryDate,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, accessOptions)
    .cookie("refreshToken", refreshToken, refreshOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // this removes the field from document
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const accessToken = user.generateAccessToken();

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .json(
        new ApiResponse(200, { accessToken, user }, "Access token refreshed")
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email, bio } = req.body;
  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email: email,
        bio,
      },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const uploadProfilePicture = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      throw new ApiError(400, "No file uploaded");
    }

    const { path } = req.file;
    const result = await uploadOnCloudinary(path);

    if (!result) {
      throw new ApiError(500, "Error uploading file to Cloudinary");
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user.profilePicture) {
      await deleteFromCloudinary(user.profilePicture);
    }

    user.profilePicture = result.url;
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new ApiResponse(200, user, "Profile picture updated successfully"));
  } catch (error) {
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path); // clean up uploaded file on error
    }
    throw error;
  }
});

const deleteProfilePicture = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user.profilePicture) {
      await deleteFromCloudinary(user.profilePicture);
      user.profilePicture = "";
      await user.save({ validateBeforeSave: false });
    }

    return res
      .status(200)
      .json(new ApiResponse(200, user, "Profile picture deleted successfully"));
  } catch (error) { 
    throw new ApiError(500, "Error deleting profile picture");
  }
});

const uploadCoverPicture = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      throw new ApiError(400, "No file uploaded");
    }

    const { path } = req.file;
    const result = await uploadOnCloudinary(path);

    if (!result) {
      throw new ApiError(500, "Error uploading file to Cloudinary");
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user.coverPicture) {
      await deleteFromCloudinary(user.coverPicture);
    }

    user.coverPicture = result.url;
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new ApiResponse(200, user, "Cover picture updated successfully"));
  } catch (error) {
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path); // clean up uploaded file on error
    }
    throw error;
  }
});

const deleteCoverPicture = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user.coverPicture) {
      await deleteFromCloudinary(user.coverPicture);
      user.coverPicture = "";
      await user.save({ validateBeforeSave: false });
    }

    return res
      .status(200)
      .json(new ApiResponse(200, user, "Cover picture deleted successfully"));
  } catch (error) {
    throw new ApiError(500, "Error deleting cover picture");
  }
});

const updateSocials = asyncHandler(async (req, res) => {
  const { github, linkedin, facebook, behance } = req.body;
  try {
    const user = await User.findById(req.user._id);
    user.socials = {
      github: github || user.socials.github,
      linkedin: linkedin || user.socials.linkedin,
      facebook: facebook || user.socials.facebook,
      behance: behance || user.socials.behance,
    };

    await user.save();

    res.status(200).json({
      message: "Socials updated successfully",
      data: user,
    });
  } catch (error) {
    throw new ApiError(500, error.message || "Failed to update socials");
  }
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  uploadProfilePicture,
  deleteProfilePicture,
  uploadCoverPicture,
  deleteCoverPicture,
  updateSocials,
};
