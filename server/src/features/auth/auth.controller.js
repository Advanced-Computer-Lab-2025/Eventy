import { signUpUser } from "./auth.service.js";
//import { loginUser } from "./auth.service.js";


export const signUp = async (req, res) => {
  try {
    const result = await signUpUser(req.body);
    res.status(201).json(result);
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      let message = "Duplicate value detected.";

      if (field === "email") message = "This email is already registered.";
      else if (field === "studentStaffId") message = "This Student/Staff ID is already registered.";
      else if (field === "companyName") message = "A company with this name already exists.";

      return res.status(400).json({ message });
    }

    res.status(400).json({ message: error.message });
  }
};




 export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Simple login validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    } 

    const user = await loginUser(email, password);
    res.status(200).json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};