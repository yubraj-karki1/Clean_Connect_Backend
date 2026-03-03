import { IsAny } from "mongoose";
import { IUser, UserModel } from "../models/user.model";

export interface IUserRepository{
    createUser(data:Partial<IUser>): Promise<IUser>;
    getUserByEmail(email: string):Promise<IUser | null>;
    getUserByPhoneNumber(phoneNumber:string):Promise <IUser | null>;
    updateUser(id: string, updateData: Partial<IUser>): Promise<IUser | null>;
    getUserById(id: string): Promise<IUser | null>;
    updateUserById(id: string, updateData: Partial<IUser>): Promise<IUser | null>;
}

export class UserRepository implements IUserRepository{
    async getUserById(id: string) {
        return await UserModel.findById(id);
    }
    async updateUserById(id: string, updateData: Partial<IUser>) {
        const updatedUser = await UserModel.findByIdAndUpdate(id, updateData, { new: true });
        return updatedUser;
    }
    async createUser(data: Partial<IUser>){
        const newUser= new UserModel(data);
        await newUser.save();
        return newUser;
    }
    async getUserByEmail(email: string){
        const user=await UserModel.findOne({"email": email});
        return user;
    }
    async getUserByPhoneNumber(phoneNumber:string){
        const user=await UserModel.findOne({"phoneNumber":phoneNumber});
        return user;
    }
    async updateUser(id: string, updateData: Partial<IUser>) {
        const updatedUser = await UserModel.findByIdAndUpdate(id, updateData, { new: true });
        return updatedUser;
    }
}