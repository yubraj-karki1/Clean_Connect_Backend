import { ServiceModel } from "../models/service.model";
import { AddressModel } from "../models/address.model";
import { BookingRepository } from "../repositories/booking.repository";
import { CreateBookingDTOType } from "../dtos/booking.dto";

export class BookingService {
  repo = new BookingRepository();

  private normalizeStatus(value: unknown) {
    return String(value || "")
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/-/g, "_")
      .trim();
  }

  private isUnassigned(provider: unknown) {
    if (provider === null || provider === undefined) return true;
    if (typeof provider === "string") {
      const normalized = provider.toLowerCase().trim();
      return (
        normalized === "" ||
        normalized === "null" ||
        normalized === "undefined" ||
        normalized === "none" ||
        normalized === "unassigned" ||
        normalized === "not_assigned" ||
        normalized === "not-assigned"
      );
    }
    if (typeof provider === "object") {
      const entity = provider as { _id?: string; id?: string };
      return !(entity._id || entity.id);
    }
    return false;
  }

      async getServices() {
      return ServiceModel.find({ isActive: { $ne: false } }).sort({ title: 1 });
    }

    async createBooking(userId: string, dto: CreateBookingDTOType) {
      const service = await ServiceModel.findById(dto.serviceId);

      if (!service || service.isActive === false) {
        throw new Error("Service not found or inactive");
      }

    const startAt = new Date(dto.startAt);
    const endAt = new Date(startAt.getTime() + dto.durationHours * 60 * 60 * 1000);
    if (isNaN(startAt.getTime()) || isNaN(endAt.getTime()) || endAt <= startAt) {
      throw new Error("Invalid date/time");
    }

    // optional: if providerId exists, prevent double booking
    if (dto.providerId) {
      const overlap = await this.repo.findProviderOverlap(dto.providerId, startAt, endAt);
      if (overlap) throw new Error("This time is already booked for the provider");
    }

    // save address
    const address = await AddressModel.create({
      userId,
      ...dto.address,
    });

    // pricing snapshot
    const hourlyRate = service.hourlyRate;
    const subtotal = Number((hourlyRate * dto.durationHours).toFixed(2));
    const fees = 0;
    const total = Number((subtotal + fees).toFixed(2));

    // create booking
    const booking = await this.repo.create({
      userId,
      serviceId: dto.serviceId,
      addressId: address._id,
      providerId: dto.providerId ?? null,
      startAt,
      endAt,
      durationHours: dto.durationHours,
      notes: dto.notes ?? "",
      status: "pending_payment",
      pricing: { hourlyRate, subtotal, fees, total, currency: "USD" },
    });

    return booking;
  }

  async myBookings(userId: string) {
    return this.repo.listByUser(userId);
  }

  async deleteBooking(userId: string, bookingId: string) {
    const booking = await this.repo.findById(bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.userId.toString() !== userId) throw new Error("Unauthorized");
    await this.repo.deleteById(bookingId);
    return { message: "Booking deleted" };
  }

  /* ===================== WORKER ===================== */

  /** Get all bookings (worker/admin overview) */
  async getAllBookings() {
    return this.repo.findAll();
  }

  /** Get all bookings available for workers to accept */
  async getAvailableJobs() {
    const rows = await this.repo.findAll();
    const closed = new Set(["completed", "cancelled", "accepted", "assigned", "in_progress"]);
    return rows.filter((row: any) => {
      const status = this.normalizeStatus(row?.status);
      const openStatus = !status || !closed.has(status);
      return openStatus && this.isUnassigned(row?.providerId);
    });
  }

  /** Get all bookings assigned to a specific worker */
  async getWorkerJobs(workerId: string) {
    return this.repo.findByWorker(workerId);
  }

  /** Worker accepts (claims) a booking */
  async acceptJob(workerId: string, bookingId: string) {
    const booking = await this.repo.findById(bookingId);
    if (!booking) throw new Error("Booking not found");

    // Must be unassigned
    if (booking.providerId) {
      throw new Error("This booking has already been accepted by another worker");
    }

    // Must be in an available status
    const unavailableStatuses = new Set(["completed", "cancelled", "accepted", "assigned", "in_progress"]);
    if (unavailableStatuses.has(this.normalizeStatus(booking.status))) {
      throw new Error("This booking is no longer available");
    }

    return this.repo.acceptBooking(bookingId, workerId);
  }

  /** Worker marks a booking as completed */
  async completeJob(workerId: string, bookingId: string) {
    const booking = await this.repo.findById(bookingId);
    if (!booking) throw new Error("Booking not found");

    // Must be assigned to this worker
    if (!booking.providerId || booking.providerId.toString() !== workerId) {
      throw new Error("You are not assigned to this booking");
    }

    // Must not already be completed or cancelled
    if (booking.status === "completed") {
      throw new Error("Booking is already completed");
    }
    if (booking.status === "cancelled") {
      throw new Error("Cannot complete a cancelled booking");
    }

    return this.repo.completeBooking(bookingId);
  }
}
