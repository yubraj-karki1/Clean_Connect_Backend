import mongoose,{Document, Schema} from "mongoose";
import { UserType } from "../types/user.types";

const userSchema: Schema= new Schema(
    {
        fullName:{type: String},
        email:{type:String, required:true, unique: true},
        phoneNumber:{type: String},
        address: { type: String, required: true },
        password:{type:String,required:true},
        role:{type:String,enum:['user','admin','worker'],default:('user')},
        profileImage: { type: String, default: null }, // store image path
        resetPasswordToken: { type: String, default: null },
        resetPasswordExpires: { type: Date, default: null },
    },
    {
        timestamps: true, 
    }
)
export interface IUser extends UserType, Document{   
    _id: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    profileImage?: string | null;
    resetPasswordToken?: string | null;
    resetPasswordExpires?: Date | null;
}
export const UserModel = mongoose.model<IUser>('User',userSchema);
