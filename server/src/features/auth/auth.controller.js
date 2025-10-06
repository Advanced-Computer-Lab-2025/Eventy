import { signUpUser } from "./auth.service.js";

export const signUp = async (req, res) => {
  try {
    const result = await signUpUser(req.body);
    res.status(201).json({ message: "Sign up successful", user: result });
  } catch (error) {
    res.status(400).json({ message: "you already have account" });
  }
};



