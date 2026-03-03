import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { upload } from "../middlewares/upload.middleware";

const router: Router = Router();
const authController = new AuthController();

// PUT /api/auth/:id (update user, with optional image)
router.put('/auth/:id', upload.single('profileImage'), authController.updateUser);

export default router;
