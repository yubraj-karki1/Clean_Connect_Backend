import { BookingModel } from "../models/booking.model";

export class BookingRepository {
  async findProviderOverlap(providerId: string, startAt: Date, endAt: Date) {
    return BookingModel.findOne({
      providerId,
      status: { $ne: "cancelled" },
      startAt: { $lt: endAt },
      endAt: { $gt: startAt },
    });
  }

  async create(data: any) {
    return BookingModel.create(data);
  }

  async listByUser(userId: string) {
    return BookingModel.find({ userId })
      .sort({ startAt: -1 })
      .populate({ path: 'serviceId', select: 'title' })
      .populate({ path: 'addressId', select: 'line1 city state zip country' });
  }

  async findById(id: string) {
    return BookingModel.findById(id);
  }

  async deleteById(id: string) {
    return BookingModel.findByIdAndDelete(id);
  }

  /* ===================== WORKER ===================== */

  /** Find all bookings that are available for workers (pending/confirmed, no provider assigned) */
  async findAvailable() {
    return BookingModel.find({
      providerId: null,
      status: { $in: ["pending_payment", "confirmed", "pending"] },
    })
      .sort({ startAt: 1 })
      .populate({ path: "serviceId", select: "title hourlyRate" })
      .populate({ path: "addressId", select: "line1 city state zip country" });
  }

  /** Find all bookings assigned to a specific worker */
  async findByWorker(workerId: string) {
    return BookingModel.find({ providerId: workerId })
      .sort({ startAt: -1 })
      .populate({ path: "serviceId", select: "title hourlyRate" })
      .populate({ path: "addressId", select: "line1 city state zip country" });
  }

  /** Assign a worker (providerId) to a booking and set status to "accepted" */
  async acceptBooking(bookingId: string, workerId: string) {
    return BookingModel.findByIdAndUpdate(
      bookingId,
      { providerId: workerId, status: "accepted" },
      { new: true }
    )
      .populate({ path: "serviceId", select: "title hourlyRate" })
      .populate({ path: "addressId", select: "line1 city state zip country" });
  }

  /** Mark a booking as completed */
  async completeBooking(bookingId: string) {
    return BookingModel.findByIdAndUpdate(
      bookingId,
      { status: "completed" },
      { new: true }
    )
      .populate({ path: "serviceId", select: "title hourlyRate" })
      .populate({ path: "addressId", select: "line1 city state zip country" });
  }
}
