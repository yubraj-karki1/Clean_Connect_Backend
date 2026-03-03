import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";

const router: Router = Router();
const authController = new AuthController();

import { upload } from "../middlewares/upload.middleware";

// Register with profile image (from camera or gallery)
router.post('/register', upload.single('profileImage'), authController.registerUser);
router.post('/login', authController.loginUser);

router.post("/request-password-reset", authController.sendResetPasswordEmail);
router.post("/reset-password/:token", authController.resetPassword);


export default router;