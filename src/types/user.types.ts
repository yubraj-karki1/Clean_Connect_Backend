import z, { TypeOf } from 'zod';

export const userSchema= z.object({
    fullName: z.string().min(2).max(100).optional(),
    email: z.email(),
    address: z.string(),
    phoneNumber:z.string().min(10).max(10),
    password: z.string().min(6),
    role: z.enum(['user','admin','worker']).default('user'),
});

export type UserType=z.infer<typeof userSchema>;