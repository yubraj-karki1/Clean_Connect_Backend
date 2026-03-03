import z from "zod";

export const CreateBookingDTO = z.object({
  serviceId: z.string().min(1),
  // send startAt as ISO string from frontend (e.g. "2026-02-11T10:30:00.000Z")
  startAt: z.string().datetime(),
  durationHours: z.number().min(0.5).max(12),
  notes: z.string().optional(),

  // allow address inline (simple for your UI)
  address: z.object({
    label: z.string().optional(),
    line1: z.string().min(3),
    line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
  }),

  // optional
  providerId: z.string().optional(),
});
export type CreateBookingDTOType = z.infer<typeof CreateBookingDTO>;
