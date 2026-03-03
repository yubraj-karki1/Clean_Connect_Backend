import { UserRepository } from "../repositories/auth.repository";
import { CreateUserDTO, LoginUserDto } from "../dtos/user.dto";
import bcryptjs from "bcryptjs";
import { HttpError } from "../errors/http-error";
import { JWT_SECRET } from "../config";
import { CLIENT_URL } from "../config";
import jwt from "jsonwebtoken";
import { sendEmail } from "../config/email";

const userRepository = new UserRepository();

export class AuthService {
  getUserById(userId: any) {
    throw new Error("Method not implemented.");
  }
  async registerUser(data: CreateUserDTO) {
    // 1. Check duplicate email
    const emailExists = await userRepository.getUserByEmail(data.email);
    if (emailExists) {
      throw new HttpError(409, "Email already exists");
    }

    // 2. Check duplicate phone number
    const phoneNumberExists = await userRepository.getUserByPhoneNumber(data.phoneNumber);
    if (phoneNumberExists) {
      throw new HttpError(400, "Phone number already exists");
    }

    // 3. Hash password
    const hashedPassword = await bcryptjs.hash(data.password, 10);
    data.password = hashedPassword;

    // 4. Create user and return full document
    const newUser = await userRepository.createUser(data);
    return newUser;
  }

  async loginUser(data: LoginUserDto) {
    const user = await userRepository.getUserByEmail(data.email);
    if (!user) {
      throw new HttpError(404, "User not found");
    }
    const validPassword = await bcryptjs.compare(data.password, user.password);
    if (!validPassword) {
      throw new HttpError(401, "Invalid credentials");
    }
    
    // 5. Generate JWT token
    const payload = {
      id: user._id,
      email: user.email,
      phoneNumber: user.phoneNumber
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
    return { token, user };
  }

  async updateUser(id: string, updateData: any) {
    // You may want to hash password if present in updateData
    if (updateData.password) {
      updateData.password = await bcryptjs.hash(updateData.password, 10);
    }
    // Update user in repository
    const updatedUser = await userRepository.updateUser(id, updateData);
    return updatedUser;
  }
  async sendResetPasswordEmail(email?: string) {
        if (!email) {
            throw new HttpError(400, "Email is required");
        }
        const user = await userRepository.getUserByEmail(email);
        if (!user) {
            throw new HttpError(404, "User not found");
        }
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' }); // 1 hour expiry
        const resetLink = `${CLIENT_URL}/reset-password?token=${token}`;
        const html = `<p>Click <a href="${resetLink}">here</a> to reset your password. This link will expire in 1 hour.</p>`;
        await sendEmail(user.email, "Password Reset", html);
        return user;
    }

    async resetPassword(token?: string, newPassword?: string) {
        try {
          if (!token || !newPassword) {
            throw new HttpError(400, "Token and new password are required");
          }
          const decoded: any = jwt.verify(token, JWT_SECRET);
          const userId = decoded.id;
          const hashedPassword = await bcryptjs.hash(newPassword, 10);
          const updatedUser = await userRepository.updateUserById(userId, { password: hashedPassword });
          if (!updatedUser) {
            throw new HttpError(404, "User not found");
          }
          return updatedUser;
        } catch (error) {
          throw new HttpError(400, "Invalid or expired token");
        }
      }
      
}