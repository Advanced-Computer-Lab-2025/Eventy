import mongoose from "mongoose";
import ApiError from "../../utils/ApiError.js";
import Poll from "./poll.model.js";
import Application from "../applications/application.model.js";

class PollServiceClass {
  async getActivePolls() {
    const polls = await Poll.find({ isActive: true, deletedAt: null }).lean();
    return polls;
  }

  async vote({ pollId, optionId, userId }) {
    if (!pollId || !optionId || !userId) {
      throw new ApiError(400, "pollId, optionId and userId are required");
    }

    let pollObjectId;
    try {
      pollObjectId = new mongoose.Types.ObjectId(pollId);
    } catch {
      throw new ApiError(400, "Invalid poll ID");
    }

    const poll = await Poll.findById(pollObjectId);
    if (!poll) {
      throw new ApiError(404, "Poll not found");
    }

    if (!poll.isActive || poll.deletedAt) {
      throw new ApiError(400, "This poll is not active");
    }

    const option = poll.options.id(optionId);
    if (!option) {
      throw new ApiError(404, "Option not found in this poll");
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Remove user from all options' votes
    poll.options.forEach((opt) => {
      opt.votes = opt.votes.filter(
        (v) => v.toString() !== userObjectId.toString()
      );
    });

    // Add user to selected option votes
    option.votes.push(userObjectId);

    try {
      await poll.save();
    } catch (err) {
      throw new ApiError(
        500,
        "Failed to save vote to database. Please try again later."
      );
    }
    return poll;
  }

  async createBoothConflictPoll({ applicationIds, question, createdBy }) {
    if (!Array.isArray(applicationIds) || applicationIds.length < 2) {
      throw new ApiError(
        400,
        "At least two applications are required to create a poll"
      );
    }

    const objectIds = [];
    for (const id of applicationIds) {
      try {
        objectIds.push(new mongoose.Types.ObjectId(id));
      } catch (e) {
        throw new ApiError(400, `Invalid application ID: ${id}`);
      }
    }

    const applications = await Application.find({ _id: { $in: objectIds } })
      .populate({
        path: "createdBy",
        select: "companyName firstName lastName email",
      })
      .exec();

    if (applications.length !== applicationIds.length) {
      throw new ApiError(404, "One or more applications were not found");
    }

    const boothApps = applications.filter((app) => app.type === "booth");
    if (boothApps.length !== applications.length) {
      throw new ApiError(400, "All applications must be booth applications");
    }

    const pendingApps = applications.filter((app) => app.status === "pending");
    if (pendingApps.length !== applications.length) {
      throw new ApiError(400, "All applications must be in pending status");
    }

    const firstLocation = applications[0].locationPreference;
    const sameLocation = applications.every(
      (app) => app.locationPreference === firstLocation
    );
    if (!sameLocation) {
      throw new ApiError(
        400,
        "All applications in the poll must have the same booth location preference"
      );
    }

    // Ensure all applications are from different vendors
    const vendorIds = applications
      .map((app) => {
        const vendorId = app.createdBy?._id || app.createdBy;
        return vendorId ? vendorId.toString() : null;
      })
      .filter((id) => id !== null);

    if (vendorIds.length !== applications.length) {
      throw new ApiError(400, "All applications must have a valid vendor");
    }

    const uniqueVendorIds = new Set(vendorIds);
    if (uniqueVendorIds.size !== vendorIds.length) {
      throw new ApiError(
        400,
        "Polls can only be created between different vendors. All selected applications must be from different vendors."
      );
    }

    // Prevent duplicate active polls for the exact same set of applications
    const existingPoll = await Poll.findOne({
      isActive: true,
      "context.type": "booth_conflict",
      relatedApplications: { $all: applications.map((app) => app._id) },
    }).lean();

    if (
      existingPoll &&
      Array.isArray(existingPoll.relatedApplications) &&
      existingPoll.relatedApplications.length === applications.length
    ) {
      throw new ApiError(
        400,
        "An active poll already exists for these vendor requests. Please end the existing poll before creating a new one."
      );
    }

    const options = applications.map((app) => {
      const vendor = app.createdBy || {};
      const vendorName =
        vendor.companyName || vendor.firstName || vendor.lastName || "Vendor";
      const durationWeeks = app.durationWeeks || 1;
      const label = `${vendorName} – ${app.boothSize}, ${durationWeeks} week${durationWeeks > 1 ? "s" : ""}`;

      return {
        optionText: label,
        votes: [],
      };
    });

    const pollQuestion =
      question && question.trim().length > 0
        ? question.trim()
        : `Which vendor should get ${firstLocation} for the conflicting booth requests?`;

    const poll = await Poll.create({
      question: pollQuestion,
      options,
      createdBy,
      relatedApplications: applications.map((app) => app._id),
      context: {
        locationPreference: firstLocation,
        durationWeeks: applications[0].durationWeeks || undefined,
        type: "booth_conflict",
      },
      isActive: true,
    });

    return poll;
  }

  async getBoothConflictPolls() {
    const polls = await Poll.find({
      "context.type": "booth_conflict",
    })
      .sort({ createdAt: -1 })
      .lean();

    // Attach simple scoring (vote counts per option)
    return polls.map((poll) => ({
      ...poll,
      options: Array.isArray(poll.options)
        ? poll.options.map((opt) => ({
            ...opt,
            voteCount: Array.isArray(opt.votes) ? opt.votes.length : 0,
          }))
        : [],
    }));
  }

  async endPoll({ pollId }) {
    let objectId;
    try {
      objectId = new mongoose.Types.ObjectId(pollId);
    } catch (e) {
      throw new ApiError(400, "Invalid poll ID");
    }

    const poll = await Poll.findById(objectId);
    if (!poll) {
      throw new ApiError(404, "Poll not found");
    }

    if (!poll.isActive) {
      return poll;
    }

    poll.isActive = false;
    poll.deletedAt = new Date();
    await poll.save();

    return poll;
  }
}

export const PollService = new PollServiceClass();
