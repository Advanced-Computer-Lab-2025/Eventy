import "dotenv/config"; // Make sure this is at the very top
import app from "./app.js";
import connectDB from "./config/db.js";
import { initCertificateScheduler } from "./utils/certificate-scheduler.js";
import Feedback from "./features/feedback/feedback.model.js";

const PORT = process.env.PORT || 5000;

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
          console.log(`Dropped legacy Feedback index: ${idx.name}`);
        } catch (dropErr) {
          console.warn(
            `Could not drop legacy Feedback index ${idx.name}:`,
            dropErr?.message || dropErr
          );
        }
      }
    }
    await Feedback.syncIndexes();
  } catch (e) {
    console.error("Failed to ensure Feedback indexes", e);
  }

  // Initialize the certificate scheduler (every 5 minutes)
  initCertificateScheduler();

  // Start the Express server
  const server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });

  // handle listen errors (EADDRINUSE)
  server.on("error", (err) => {
    if (err && err.code === "EADDRINUSE") {
      console.error(
        `Port ${PORT} is already in use. Stop the other process or change PORT.`
      );
      process.exit(1);
    }
    throw err;
  });
};

startServer();
