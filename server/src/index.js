import logger from "./utils/logger.js";
import "dotenv/config"; // Make sure this is at the very top
import "./instrument.js";
import app from "./app.js";
import connectDB from "./config/db.js";
import { startReminderScheduler } from "./features/events/event.service.js";
import { initCertificateScheduler } from "./utils/certificate-scheduler.js";
import Feedback from "./features/feedback/feedback.model.js";

const PORT = process.env.PORT || 8080;

const startServer = async () => {
  // Connect to the database before starting the server
  await connectDB();

  // Ensure Feedback indexes are correct (drop legacy unique index on eventId+userId)
  try {
    const indexes = await Feedback.collection.indexes();
    for (const idx of indexes) {
      const isEventUserIdx =
        idx?.key && idx.key.eventId === 1 && idx.key.userId === 1;
      const isOurNewIndex = idx?.name === "rating_unique_per_user_event";
      if (isEventUserIdx && !isOurNewIndex) {
        try {
          await Feedback.collection.dropIndex(idx.name);
          logger.info(`Dropped legacy Feedback index: ${idx.name}`);
        } catch (dropErr) {
          logger.warn(
            `Could not drop legacy Feedback index ${idx.name}:`,
            dropErr?.message || dropErr
          );
        }
      }
    }
    await Feedback.syncIndexes();
  } catch (e) {
    logger.error("Failed to ensure Feedback indexes", e);
  }

  // Initialize the certificate scheduler (every 5 minutes)
  initCertificateScheduler();

  // Start the Express server
  const server = app.listen(PORT, () => {
    logger.info(`Server listening on port ${PORT}`);

    // Start the event reminder scheduler
    startReminderScheduler();
    logger.info("Event reminder scheduler started");
  });

  // handle listen errors (EADDRINUSE)
  server.on("error", (err) => {
    if (err && err.code === "EADDRINUSE") {
      logger.error(
        `Port ${PORT} is already in use. Stop the other process or change PORT.`
      );
      process.exit(1);
    }
    throw err;
  });
};

startServer();
