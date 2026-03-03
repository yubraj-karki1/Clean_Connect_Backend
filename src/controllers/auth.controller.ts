import { AuthService } from "../services/auth.service";
import z from "zod";
import { Request, Response } from "express";
import { CreateUserDTO, LoginUserDto } from "../dtos/user.dto";

const authService = new AuthService();

export class AuthController {
  async registerUser(req: Request, res: Response) {
    try {
      let profileImage: string | undefined = undefined;
      if (req.file) {
        profileImage = `uploads/profile/${req.file.filename}`;
      }
      const parsedData = CreateUserDTO.safeParse({
        ...req.body,
        profileImage,
      });

      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: parsedData.error.message,
        });
      }

      const newUser = await authService.registerUser(parsedData.data);

      return res.status(201).json({
        success: true,
        message: "Register Success",
        data: {
          id: newUser._id,
          email: newUser.email,
          role: newUser.role,
        },
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }
  async loginUser(req: Request, res: Response) {
    try {
      const parsedData = LoginUserDto.safeParse(req.body);

      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: parsedData.error.message,
        });
      }
      const { token, user } = await authService.loginUser(parsedData.data);
      return res.status(200).json({
        success: true,
        message: "Login Success",
        token,
        data: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role, 
        },
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }
  async updateUser(req: Request, res: Response) {
    try {
      let profileImage: string | undefined = undefined;
      if (req.file) {
        profileImage = `uploads/profile/${req.file.filename}`;
      }
      const updateData = profileImage ? { ...req.body, profileImage } : req.body;
      const updatedUser = await authService.updateUser(req.params.id, updateData);
      if (!updatedUser) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      return res.json({ success: true, message: "User updated", data: updatedUser });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }
  async sendResetPasswordEmail(req: Request, res: Response) {
        try {
            const email = req.body.email;
            const user = await authService.sendResetPasswordEmail(email);
            return res.status(200).json(
                { success: true,
                    data: user,
                    message: "If the email is registered, a reset link has been sent." }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async resetPassword(req: Request, res: Response) {
        try {

           const token = req.params.token;
            const { newPassword } = req.body;
            await authService.resetPassword(token, newPassword);
            return res.status(200).json(
                { success: true, message: "Password has been reset successfully." }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }
}
