// src/routes/admin/user.route.ts

import { Router } from "express";
import { AdminUserController } from "../../controllers/admin/user.contoller";
import { authorizedMiddleware } from "../../middlewares/authorized.middleware";
import { upload } from "../../middlewares/upload.middleware";

const router = Router();
const controller = new AdminUserController();

/* ===========================
   USER PROFILE (LOGGED IN)
=========================== */

router.get(
  "/profile",
  authorizedMiddleware,
  controller.getUserProfile.bind(controller)
);

router.post(
  "/profile/image",
  authorizedMiddleware,
  upload.single("image"),
  controller.uploadUserProfileImage.bind(controller)
);

/* ===========================
   ADMIN USER MANAGEMENT
   Base: /api/admin/users
=========================== */

// Create user
router.post(
  "/",
  authorizedMiddleware,
  controller.createUser.bind(controller)
);

// Get all users
router.get(
  "/",
  authorizedMiddleware,
  controller.getAllUsers.bind(controller)
);

// ✅ Get user by ID
router.get(
  "/:id",
  authorizedMiddleware,
  controller.getUserById.bind(controller)
);

// ✅ Update user by ID
router.put(
  "/:id",
  authorizedMiddleware,
  upload.single("profileImage"),
  controller.updateUser.bind(controller)
);

// ✅ Delete user by ID
router.delete(
  "/:id",
  authorizedMiddleware,
  controller.deleteUser.bind(controller)
);

export default router;
