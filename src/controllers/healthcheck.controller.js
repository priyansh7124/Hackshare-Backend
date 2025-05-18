import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getCpuUsage,
  getMemoryUsage,
  checkDatabaseConnection,
  checkThirdPartyService
} from "../utils/SystemCheck.js";

const healthcheck = asyncHandler(async (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: "OK",
    timestamp: new Date(Date.now()),
    environment: process.env.NODE_ENV || "development",
    version: process.version,
    memoryUsage: getMemoryUsage(),
    cpuUsage: getCpuUsage(),
  };

  try {
    const dbState = await checkDatabaseConnection();
    healthCheck.db = dbState;

    const thirdPartyServiceStatus = await checkThirdPartyService();
    healthCheck.thirdPartyService = thirdPartyServiceStatus;

    res.status(200).json(
      new ApiResponse(
        200,
        {
          healthCheck,
        },
        "Health check details"
      )
    );
  } catch (error) {
    throw new ApiError(400, "Healthcheck not working");
  }
});

export { healthcheck };
