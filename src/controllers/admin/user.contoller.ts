// src/controllers/admin/user.controller.ts

import { Request, Response } from "express";
import mongoose from "mongoose";
import z from "zod";
import path from "path";
import fs from "fs/promises";
import { UserModel } from "../../models/user.model";
import { AuthService } from "../../services/auth.service";
import { UserService } from "../../services/admin/user.service";
import { CreateUserDTO } from "../../dtos/user.dto";


const authService = new AuthService();
const userService = new UserService();

export class AdminUserController {

  // =========================
  // CREATE USER (ADMIN)
  // =========================
  async createUser(req: Request, res: Response) {
    try {
      const parsedData = CreateUserDTO.safeParse(req.body);

      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: parsedData.error.message,
        });
      }

      const newUser = await authService.registerUser(parsedData.data);

      return res.status(201).json({
        success: true,
        message: "Registered successfully",
        data: newUser,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  // =========================
  // GET ALL USERS (ADMIN)
  // =========================
  async getAllUsers(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const { users, pagination } = await userService.getAllUsers(page, limit);
      return res.status(200).json({
        success: true,
        message: "All users fetched successfully",
        data: users,
        pagination,
      });
    } catch {
      return res.status(500).json({
        success: false,
        message: "Error fetching users",
      });
    }
  }

  // =========================
  // GET USER BY ID (ADMIN)
  // =========================
  async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params; // ✅ FIXED

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID format",
        });
      }

      const user = await UserModel.findById(id).select("-password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "User fetched successfully",
        data: user,
      });
    } catch {
      return res.status(500).json({
        success: false,
        message: "Error fetching user",
      });
    }
  }

  // =========================
  // UPDATE USER (ADMIN)
  // =========================
  async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID format",
        });
      }

      const updateData = { ...req.body };

      // Handle profile image upload
      if (req.file) {
        updateData.profileImage = path
          .relative(process.cwd(), req.file.path)
          .replace(/\\/g, "/");
      }

      const updatedUser = await authService.updateUser(id, updateData);
      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
      return res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: updatedUser,
      });
    } catch (error: any) {
      console.error("UPDATE USER ERROR:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  // =========================
  // DELETE USER (ADMIN)
  // =========================
  async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params; // ✅ FIXED

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID format",
        });
      }

      const deletedUser = await UserModel.findByIdAndDelete(id);

      if (!deletedUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error: any) {
      console.error("DELETE USER ERROR:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  // =========================
  // UPLOAD PROFILE IMAGE
  // =========================
  async uploadUserProfileImage(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No image file uploaded",
        });
      }

      const imagePath = path
        .relative(process.cwd(), req.file.path)
        .replace(/\\/g, "/");

      const user = await UserModel.findByIdAndUpdate(
        userId,
        { profileImage: imagePath },
        { new: true }
      ).select("-password");

      if (!user) {
        await fs.unlink(req.file.path);
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const userData = user.toObject();
      if (userData.profileImage) {
        userData.profileImage = `${userData.profileImage}?t=${Date.now()}`;
      }

      return res.status(200).json({
        success: true,
        message: "Profile image uploaded successfully",
        data: userData,
      });
    } catch (error) {
      console.error("Upload profile image error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // =========================
  // GET LOGGED-IN USER PROFILE
  // =========================
  async getUserProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;

      const user = await UserModel.findById(userId).select("-password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Flatten address for Flutter compatibility
      let userObj = user.toObject();
      if (
        userObj.address &&
        typeof userObj.address === 'object' &&
        userObj.address !== null &&
        'line1' in userObj.address &&
        typeof (userObj.address as any).line1 === 'string'
      ) {
        userObj.address = (userObj.address as any).line1;
      } else if (typeof userObj.address !== 'string') {
        userObj.address = '';
      }

      return res.status(200).json({
        success: true,
        data: userObj,
      });
    } catch (error) {
      console.error("Get profile error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}
