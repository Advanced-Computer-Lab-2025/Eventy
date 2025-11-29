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
    console.log("⏳ Certificate job already running, skipping this execution");
    return;
  }

  isRunning = true;
  console.log("\n🔍 Starting automated certificate sending job...");
  console.log(`⏰ Time: ${new Date().toLocaleString()}`);

  try {
    const result = await sendCertificatesForCompletedWorkshops();

    console.log("\n✅ Certificate job completed successfully!");
    console.log(`📊 Summary:`);
    console.log(`   - Workshops processed: ${result.workshopsProcessed}`);
    console.log(`   - Certificates sent: ${result.totalSent}`);
    console.log(`   - Failed: ${result.totalFailed}`);

    if (result.workshops && result.workshops.length > 0) {
      console.log("\n📋 Workshop Details:");
      result.workshops.forEach((workshop) => {
        console.log(
          `   • ${workshop.workshopName}: ${workshop.sent} sent, ${workshop.failed} failed`
        );
      });
    }
  } catch (error) {
    console.error("\n❌ Certificate job failed:", error.message);
    console.error("Stack trace:", error.stack);
  } finally {
    isRunning = false;
    console.log("\n" + "=".repeat(60) + "\n");
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

  console.log("\n🚀 Certificate Scheduler Initialized");
  console.log(`⏰ Schedule: Every 5 minutes`);

  cron.schedule(schedule, sendCertificatesJob, {
    timezone: "Africa/Cairo", // Adjust to your timezone
  });

  // Optional: Run immediately on startup for testing (comment out in production)
  // console.log("🧪 Running initial certificate check...");
  // sendCertificatesJob();
};

/**
 * Manual trigger for testing purposes
 * Can be called via API endpoint
 */
export const triggerCertificateJobManually = async () => {
  console.log("\n🔧 Manual trigger activated for certificate sending...");
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
