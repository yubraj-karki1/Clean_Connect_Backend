import mongoose, { Schema } from "mongoose";

const BookingSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true },
    addressId: { type: Schema.Types.ObjectId, ref: "Address", required: true },

    // optional (if you assign cleaners/providers later)
    providerId: { type: Schema.Types.ObjectId, ref: "User", default: null },

    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },

    durationHours: { type: Number, required: true, min: 0.5 },
    notes: { type: String, default: "" },

    status: {
      type: String,
      enum: ["pending_payment", "confirmed", "pending", "accepted", "assigned", "in-progress", "completed", "cancelled"],
      default: "pending_payment",
    },

    // pricing snapshot (important!)
    pricing: {
      hourlyRate: { type: Number, required: true },
      subtotal: { type: Number, required: true },
      fees: { type: Number, default: 0 },
      total: { type: Number, required: true },
      currency: { type: String, default: "USD" },
    },
  },
  { timestamps: true }
);

// fast queries + helps overlap checks
BookingSchema.index({ userId: 1, startAt: 1 });
BookingSchema.index({ providerId: 1, startAt: 1, endAt: 1 });

export const BookingModel = mongoose.model("Booking", BookingSchema);
