import express from "express";
import { signUp } from "./auth.controller.js";
import { login, logout } from "./auth.controller.js";


const router = express.Router();

router.post("/signup", signUp);

router.post("/login", login);

router.post("/logout", logout);

export default router;
