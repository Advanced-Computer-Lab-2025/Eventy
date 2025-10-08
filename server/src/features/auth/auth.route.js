import express from "express";
import { signUp } from "./auth.controller.js";
//import { login } from "./auth.controller.js";


const router = express.Router();

router.post("/signup", signUp);

//router.post("/login", login);

export default router;
