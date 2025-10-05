import { User } from './user.model.js';
import { UserValidation } from './user.validation.js';

// Controller class — import this and call its static methods in routes
export default class UserController {
  // GET /api/users/pending --> The users that are not assigned a role yet
  static async getPendingUsers(req, res) {
    try {
      const pending = await User.find({ status: 'pending', role: null }).select('-password');
      return res.status(200).json({ success: true, data: pending });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // PATCH /api/users/:id/assign-role
  static async assignRole(req, res) {
    try {
      const payload = {
        ...req.body,
        userId: req.params.id,
      };
      const { error } = UserValidation.assignRole.validate(payload);
      if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
      }

      const { role } = req.body;
      const userId = req.params.id;

      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      if (!(user.status === 'pending' && user.role === null)) {
        return res.status(400).json({
          success: false,
          message: 'User cannot be assigned a role at this stage (must be pending & unassigned)',
        });
      }

      user.role = role;
      await user.save();

      return res.status(200).json({
        success: true,
        message: `Role '${role}' assigned successfully`,
        data: { userId: user._id, role: user.role }
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}
