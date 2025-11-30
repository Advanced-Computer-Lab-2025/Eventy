import mongoose from "mongoose";
import ApiError from "../../utils/ApiError.js";
import Poll from "./poll.model.js";

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
}

export const PollService = new PollServiceClass();
