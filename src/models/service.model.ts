import mongoose, { Schema } from "mongoose";

const ServiceSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    hourlyRate: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ServiceModel = mongoose.model("Service", ServiceSchema);
