import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { User } from "./user.model.js";

export default class UserPublicController {
  // GET /api/users/professors
  static async getProfessors(req, res, next) {
    try {
      // Return only professors with status 'active'
      const professors = await User.find({
        role: "professor",
        status: "active",
      })
        .select("_id firstName lastName email")
        .sort({ lastName: 1 });

      return res
        .status(200)
        .json(new ApiResponse(200, professors, "Professors fetched"));
    } catch (err) {
      next(new ApiError(500, err.message));
    }
  }
}
