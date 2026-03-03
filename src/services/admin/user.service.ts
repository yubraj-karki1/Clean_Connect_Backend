import mongoose from "mongoose";
import { UserModel } from "../../models/user.model";

export class UserService {

  // CREATE USER (already handled in AuthService)
  // ----------------------------

  async getAllUsers(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const total = await UserModel.countDocuments();
    const users = await UserModel.find()
      .select("-password")
      .skip(skip)
      .limit(limit);
    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(userId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID format");
    }

    const user = await UserModel.findById(userId).select("-password");
    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async updateUser(userId: string, updateData: any) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID format");
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      throw new Error("User not found");
    }

    return updatedUser;
  }

  async deleteUser(userId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID format");
    }

    const deletedUser = await UserModel.findByIdAndDelete(userId);

    if (!deletedUser) {
      throw new Error("User not found");
    }

    return deletedUser;
  }

  async updateProfileImage(userId: string, imagePath: string) {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { profileImage: imagePath },
      { new: true }
    ).select("-password");

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async getProfile(userId: string) {
    const user = await UserModel.findById(userId).select("-password");

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }
}
