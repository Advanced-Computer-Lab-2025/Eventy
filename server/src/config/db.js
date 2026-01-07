import logger from "../utils/logger.js";
import mongoose from "mongoose";

const maskCredentials = (uri) => {
  try {
    return uri.replace(
      /(\/\/)(.*?):(.*?)@/,
      (m, p1, user) => `${p1}${user}:******@`
    );
  } catch {
    return uri;
  }
};

const appendAuthSourceAdmin = (uri) => {
  if (/authSource=/i.test(uri)) return uri;
  if (uri.includes("?")) return `${uri}&authSource=admin`;
  if (uri.endsWith("/")) return `${uri}?authSource=admin`;
  return `${uri}/?authSource=admin`;
};

const buildUriFromParts = () => {
  const user = process.env.MONGO_USER;
  const pass = process.env.MONGO_PASS;
  const host = process.env.MONGO_HOST || "eventy.eenyskp.mongodb.net";
  const db = process.env.MONGO_DB || "";
  if (!user || !pass) return null;
  const u = encodeURIComponent(user);
  const p = encodeURIComponent(pass);
  const dbSegment = db ? `/${db}` : "/";
  return `mongodb+srv://${u}:${p}@${host}${dbSegment}?retryWrites=true&w=majority&appName=Eventy`;
};

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    logger.error(
      "MONGO_URI is not set in environment variables. Please set it in your .env file."
    );
    process.exit(1);
  }

  logger.info(`Attempting MongoDB connection using: ${maskCredentials(uri)}`);

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    logger.info("MongoDB Connected successfully!");
    return;
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);

    if (/authentication failed|bad auth|auth failed/i.test(error.message)) {
      logger.error(
        "Authentication error detected. Will retry once with authSource=admin appended for troubleshooting."
      );
      const alt = appendAuthSourceAdmin(uri);
      logger.info(`Retrying with: ${maskCredentials(alt)}`);
      try {
        await mongoose.connect(alt, { serverSelectionTimeoutMS: 5000 });
        logger.info("MongoDB Connected successfully on retry!");
        return;
      } catch (err2) {
        logger.error(`Retry failed: ${err2.message}`);
      }

      const built = buildUriFromParts();
      if (built) {
        logger.error(
          "Attempting a second retry by building the connection string from MONGO_USER/MONGO_PASS/MONGO_HOST (this will URL-encode credentials)."
        );
        logger.info(`Retrying with: ${maskCredentials(built)}`);
        try {
          await mongoose.connect(built, { serverSelectionTimeoutMS: 5000 });
          logger.info("MongoDB Connected successfully on second retry!");
          return;
        } catch (err3) {
          logger.error(`Second retry failed: ${err3.message}`);
        }
      }
    }

    logger.error(
      "Check that the username and password are correct, that the user exists in your MongoDB Atlas project, and that your current IP address is allowed in Network Access."
    );
    process.exit(1);
  }
};

export default connectDB;
