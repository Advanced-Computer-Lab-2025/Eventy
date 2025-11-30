import { PollService } from "./poll.service.js";
import { voteSchema } from "./poll.validation.js";

export class PollController {
  async listActivePolls(req, res, next) {
    try {
      const polls = await PollService.getActivePolls();
      const userId = req.user?._id?.toString();

      const enriched = polls.map((poll) => {
        let userVoteOptionId = null;
        if (userId) {
          for (const opt of poll.options || []) {
            if ((opt.votes || []).some((v) => v.toString() === userId)) {
              userVoteOptionId = opt._id.toString();
              break;
            }
          }
        }
        return { ...poll, userVoteOptionId };
      });

      return res.status(200).json({
        success: true,
        message: "Active polls fetched successfully",
        data: enriched,
      });
    } catch (error) {
      next(error);
    }
  }

  async vote(req, res, next) {
    try {
      const { pollId } = req.params;
      const { optionId } = req.body || {};
      const userId = req.user?._id;

      // Validate optionId
      const { error } = voteSchema.validate({ optionId });
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const poll = await PollService.vote({ pollId, optionId, userId });

      return res.status(200).json({
        success: true,
        message: "Vote submitted successfully",
        data: poll,
      });
    } catch (error) {
      next(error);
    }
  }
}
