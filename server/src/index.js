import "dotenv/config"; // Make sure this is at the very top
import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  // Connect to the database before starting the server
  await connectDB();

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
