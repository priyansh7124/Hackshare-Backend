import { createLogger, format, transports } from "winston";
const { combine, timestamp, json } = format;

// Create a Winston logger
const logger = createLogger({
  level: "info",
  format: combine(timestamp(), json()), // File logs only
  transports: [
    new transports.File({ filename: "app.log" }), // Logs to file only
  ],
});

export default logger;
