import { PollService } from "./poll.service.js";

export class PollController {
  async listBoothConflictPolls(req, res, next) {
    try {
      const polls = await PollService.getBoothConflictPolls();

      return res.status(200).json({
        success: true,
        message: "Booth conflict polls fetched successfully",
        data: polls,
      });
    } catch (error) {
      next(error);
    }
  }

  async createBoothConflictPoll(req, res, next) {
    try {
      const { applicationIds, question } = req.body || {};
      const createdBy = req.user?._id;

      const poll = await PollService.createBoothConflictPoll({
        applicationIds,
        question,
        createdBy,
      });

      return res.status(201).json({
        success: true,
        message: "Booth conflict poll created successfully",
        data: poll,
      });
    } catch (error) {
      next(error);
    }
  }

  async endPoll(req, res, next) {
    try {
      const { pollId } = req.params;

      const poll = await PollService.endPoll({ pollId });

      return res.status(200).json({
        success: true,
        message: "Poll ended successfully",
        data: poll,
      });
    } catch (error) {
      next(error);
    }
  }
}

