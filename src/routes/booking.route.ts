import { Router } from "express";
import { BookingController } from "../controllers/booking.controller";
import { authorizedMiddleware } from "../middlewares/authorized.middleware";

const router = Router();
const controller = new BookingController();

// for dropdown "Select Service Type"
router.get("/services", controller.getServices.bind(controller));

// booking actions
router.post("/", authorizedMiddleware, controller.createBooking.bind(controller));
router.get("/me", authorizedMiddleware, controller.myBookings.bind(controller));

// worker routes (must be before /:id to avoid param collision)
router.get("/available", authorizedMiddleware, controller.getAvailableJobs.bind(controller));
router.get("/worker/me", authorizedMiddleware, controller.getWorkerJobs.bind(controller));
router.patch("/:id/accept", authorizedMiddleware, controller.acceptJob.bind(controller));
router.patch("/:id/complete", authorizedMiddleware, controller.completeJob.bind(controller));

router.delete("/:id", authorizedMiddleware, controller.deleteBooking.bind(controller));

export default router;
