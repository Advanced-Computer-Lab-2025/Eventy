import { signUpUser } from "./auth.service.js";
import { loginUser } from "./auth.service.js";
import { logoutUser } from "./auth.service.js";
import { confirmEmailVerification } from "./auth.service.js";

export const signUp = async (req, res) => {
  try {
    const result = await signUpUser(req.body);
    res.status(201).json(result);
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      let message = "Duplicate value detected.";

      if (field === "email") message = "This email is already registered.";
      else if (field === "studentStaffId")
        message = "This Student/Staff ID is already registered.";
      else if (field === "companyName")
        message = "A company with this name already exists.";

      return res.status(400).json({ message });
    }

    res.status(400).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const result = await loginUser(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const result = await logoutUser();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const result = await confirmEmailVerification(token);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};