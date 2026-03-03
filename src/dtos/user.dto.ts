import z from "zod";
import { userSchema } from "../types/user.types";

export const CreateUserDTO = userSchema.pick({
    fullName: true,
    email: true,
    phoneNumber: true,
    address: true,
    password: true,
    role: true,
}).extend({
    confirmPassword: z.string().min(6)
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});
export type CreateUserDTO= z.infer<typeof CreateUserDTO>;

export const LoginUserDto = z.object({
    email:z.email(),
    password:z.string().min(6)
})

export type LoginUserDto = z.infer<typeof LoginUserDto>;