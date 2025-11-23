import { PollService } from "./poll.service.js";
import {
  createBoothConflictPollSchema,
  endPollSchema,
} from "./poll.validation.js";

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
      const { error, value } = createBoothConflictPollSchema.validate(
        req.body,
        { abortEarly: false }
      );

      if (error) {
        const errorMessage = error.details
          .map((detail) => detail.message)
          .join(", ");
        return res.status(400).json({
          success: false,
          message: errorMessage,
        });
      }

      const { applicationIds, question } = value;
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
      const { error, value } = endPollSchema.validate(req.params, {
        abortEarly: false,
      });

      if (error) {
        const errorMessage = error.details
          .map((detail) => detail.message)
          .join(", ");
        return res.status(400).json({
          success: false,
          message: errorMessage,
        });
      }

      const { pollId } = value;

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
