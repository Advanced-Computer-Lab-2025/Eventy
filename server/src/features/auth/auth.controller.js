import { signUpUser } from "./auth.service.js";
import { loginUser } from "./auth.service.js";
import { logoutUser } from "./auth.service.js";
import { confirmEmailVerification } from "./auth.service.js";

export const signUp = async (req, res) => {
  try {
    // Build signup data from request body but explicitly ignore any
    // client-provided companyLogoUrl or taxCardUrl values (we only accept uploaded files)
    const {
      companyLogoUrl: _ignoreLogo,
      taxCardUrl: _ignoreTax,
      ...rest
    } = req.body || {};
    const data = { ...rest };
    try {
      if (req.files) {
        // multer stores fields in req.files as arrays
        if (req.files.companyLogo && req.files.companyLogo[0]) {
          const file = req.files.companyLogo[0];
          const url = `${req.protocol}://${req.get("host")}/uploads/id-cards/${file.filename}`;
          data.companyLogoUrl = url;
        }
        if (req.files.taxCard && req.files.taxCard[0]) {
          const file = req.files.taxCard[0];
          const url = `${req.protocol}://${req.get("host")}/uploads/id-cards/${file.filename}`;
          data.taxCardUrl = url;
        }
      }
    } catch (err) {
      // If mapping file URLs failed, continue — validation will catch missing fields
    }

    const result = await signUpUser(data);
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
