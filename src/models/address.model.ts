import mongoose, { Schema } from "mongoose";

const AddressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    label: { type: String, default: "Service Address" },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String },
    state: { type: String },
    zip: { type: String },
    country: { type: String, default: "NP" },
    lat: { type: Number },
    lng: { type: Number },
  },
  { timestamps: true }
);

export const AddressModel = mongoose.model("Address", AddressSchema);
