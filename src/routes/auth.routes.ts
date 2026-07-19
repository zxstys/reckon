import { Router } from "express";
import * as authController from "../controllers/auth.controller";

const router = Router();

router.get("/login", authController.showLogin);
router.post("/login", authController.login);
router.get("/register", authController.showRegister);
router.post("/register", authController.register);
router.post("/logout", authController.logout);

export default router;
