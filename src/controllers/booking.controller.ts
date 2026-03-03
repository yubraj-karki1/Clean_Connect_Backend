import { Request, Response } from "express";
import { BookingService } from "../services/booking.service";
import { CreateBookingDTO } from "../dtos/booking.dto";
import z from "zod";

export class BookingController {
  service = new BookingService();

  async getServices(req: Request, res: Response) {
    try {
      const data = await this.service.getServices();
      return res.json({ success: true, data });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }

  async createBooking(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const parsed = CreateBookingDTO.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError ? z.prettifyError(parsed.error) : parsed.error.message,
        });
      }

      const booking = await this.service.createBooking(userId, parsed.data);
      return res.status(201).json({ success: true, data: booking, message: "Booking created" });
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e.message });
    }
  }

  async myBookings(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const data = await this.service.myBookings(userId);
      return res.json({ success: true, data });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }

  async deleteBooking(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const { id } = req.params;
      const result = await this.service.deleteBooking(userId, id);
      return res.json({ success: true, ...result });
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e.message });
    }
  }

  /* ===================== WORKER ===================== */

  /** GET /api/bookings/available — all open bookings for workers */
  async getAvailableJobs(req: Request, res: Response) {
    try {
      const data = await this.service.getAvailableJobs();
      return res.json({ success: true, data });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }

  /** GET /api/bookings/worker/me — current worker's accepted bookings */
  async getWorkerJobs(req: Request, res: Response) {
    try {
      const workerId = (req as any).user?.id;
      if (!workerId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const data = await this.service.getWorkerJobs(workerId);
      return res.json({ success: true, data });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }

  /** PATCH /api/bookings/:id/accept — worker claims a booking */
  async acceptJob(req: Request, res: Response) {
    try {
      const workerId = (req as any).user?.id;
      if (!workerId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const { id } = req.params;
      const booking = await this.service.acceptJob(workerId, id);
      return res.json({ success: true, data: booking, message: "Job accepted" });
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e.message });
    }
  }

  /** GET /api/bookings — list all bookings (worker/admin view) */
  async getAllBookings(req: Request, res: Response) {
    try {
      const data = await this.service.getAllBookings();
      return res.json({ success: true, data });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }

  /** PATCH /api/bookings/:id/complete — worker marks booking as done */
  async completeJob(req: Request, res: Response) {
    try {
      const workerId = (req as any).user?.id;
      if (!workerId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const { id } = req.params;
      const booking = await this.service.completeJob(workerId, id);
      return res.json({ success: true, data: booking, message: "Job completed" });
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e.message });
    }
  }
}
