import logger from "./logger.js";
import cron from "node-cron";
import { sendCertificatesForCompletedWorkshops } from "../features/events/event.service.js";

/**
 * Certificate Scheduler - Automatically sends workshop certificates
 *
 * This cron job runs daily at 9:00 AM to check for completed workshops
 * and sends attendance certificates to attendees who haven't received them yet.
 */

let isRunning = false;

const sendCertificatesJob = async () => {
  // Prevent concurrent executions
  if (isRunning) {
    logger.info("⏳ Certificate job already running, skipping this execution");
    return;
  }

  isRunning = true;
  logger.info("\n🔍 Starting automated certificate sending job...");
  logger.info(`⏰ Time: ${new Date().toLocaleString()}`);

  try {
    const result = await sendCertificatesForCompletedWorkshops();

    logger.info("\n✅ Certificate job completed successfully!");
    logger.info(`📊 Summary:`);
    logger.info(`   - Workshops processed: ${result.workshopsProcessed}`);
    logger.info(`   - Certificates sent: ${result.totalSent}`);
    logger.info(`   - Failed: ${result.totalFailed}`);

    if (result.workshops && result.workshops.length > 0) {
      logger.info("\n📋 Workshop Details:");
      result.workshops.forEach((workshop) => {
        logger.info(
          `   • ${workshop.workshopName}: ${workshop.sent} sent, ${workshop.failed} failed`
        );
      });
    }
  } catch (error) {
    logger.error("\n❌ Certificate job failed:", error.message);
    logger.error("Stack trace:", error.stack);
  } finally {
    isRunning = false;
    logger.info("\n" + "=".repeat(60) + "\n");
  }
};

/**
 * Initialize the certificate scheduler
 * Runs every day at 9:00 AM
 */
export const initCertificateScheduler = () => {
  // Schedule: Run every 5 minutes
  // Cron format: "minute hour day month weekday"
  const schedule = "*/5 * * * *"; // every 5 minutes

  logger.info("\n🚀 Certificate Scheduler Initialized");
  logger.info(`⏰ Schedule: Every 5 minutes`);

  cron.schedule(schedule, sendCertificatesJob, {
    timezone: "Africa/Cairo", // Adjust to your timezone
  });

  // Optional: Run immediately on startup for testing (comment out in production)
  // logger.info("🧪 Running initial certificate check...");
  // sendCertificatesJob();
};

/**
 * Manual trigger for testing purposes
 * Can be called via API endpoint
 */
export const triggerCertificateJobManually = async () => {
  logger.info("\n🔧 Manual trigger activated for certificate sending...");
  return await sendCertificatesJob();
};

/**
 * Get the next scheduled run time
 */
const getNextRunTime = () => {
  const now = new Date();
  const next = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes later
  return next.toLocaleString();
};
