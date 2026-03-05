process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";
process.env.MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/clean-connect-test";

import request from "supertest";
import jwt from "jsonwebtoken";

const mockAuthService = {
  registerUser: jest.fn(),
  loginUser: jest.fn(),
  updateUser: jest.fn(),
  sendResetPasswordEmail: jest.fn(),
  resetPassword: jest.fn(),
};

const mockBookingService = {
  getServices: jest.fn(),
  createBooking: jest.fn(),
  myBookings: jest.fn(),
  deleteBooking: jest.fn(),
  getAvailableJobs: jest.fn(),
  getWorkerJobs: jest.fn(),
  acceptJob: jest.fn(),
  getAllBookings: jest.fn(),
  completeJob: jest.fn(),
};

const mockUserService = {
  getAllUsers: jest.fn(),
};

const mockUserModel = {
  findById: jest.fn(),
  findByIdAndDelete: jest.fn(),
  findByIdAndUpdate: jest.fn(),
};

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

jest.mock("../../src/services/auth.service", () => ({
  AuthService: jest.fn(() => mockAuthService),
}));

jest.mock("../../src/services/booking.service", () => ({
  BookingService: jest.fn(() => mockBookingService),
}));

jest.mock("../../src/services/admin/user.service", () => ({
  UserService: jest.fn(() => mockUserService),
}));

jest.mock("../../src/models/user.model", () => ({
  UserModel: mockUserModel,
}));

const app = require("../../src/index").default;

describe("Generated integration tests", () => {
  const validToken = "valid-token";
  const validId = "507f1f77bcf86cd799439011";

  beforeEach(() => {
    jest.clearAllMocks();
    (jwt.verify as jest.Mock).mockImplementation((token: string) => {
      if (token === validToken) {
        return { id: "user-1", email: "user@example.com", role: "admin" };
      }
      throw new Error("Invalid token");
    });
  });

  describe("Auth routes (10)", () => {
    it("1. POST /api/auth/register returns 201 for valid payload", async () => {
      mockAuthService.registerUser.mockResolvedValue({ _id: "u1", email: "a@example.com", role: "user" });

      const res = await request(app).post("/api/auth/register").send({
        fullName: "Auth User",
        email: "a@example.com",
        phoneNumber: "1234567890",
        address: "Street",
        password: "secret1",
        confirmPassword: "secret1",
        role: "user",
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it("2. POST /api/auth/register returns 400 for invalid body", async () => {
      const res = await request(app).post("/api/auth/register").send({ email: "bad-email" });
      expect(res.status).toBe(400);
    });

    it("3. POST /api/auth/register surfaces service error status", async () => {
      mockAuthService.registerUser.mockRejectedValue({ statusCode: 409, message: "Email already exists" });

      const res = await request(app).post("/api/auth/register").send({
        fullName: "Auth User",
        email: "dup@example.com",
        phoneNumber: "1234567890",
        address: "Street",
        password: "secret1",
        confirmPassword: "secret1",
        role: "user",
      });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain("Email already exists");
    });

    it("4. POST /api/auth/login returns 200 on success", async () => {
      mockAuthService.loginUser.mockResolvedValue({
        token: "jwt",
        user: { _id: "u4", fullName: "User", email: "u4@example.com", role: "user" },
      });

      const res = await request(app).post("/api/auth/login").send({ email: "u4@example.com", password: "secret1" });

      expect(res.status).toBe(200);
      expect(res.body.token).toBe("jwt");
    });

    it("5. POST /api/auth/login returns 400 for invalid payload", async () => {
      const res = await request(app).post("/api/auth/login").send({ email: "wrong" });
      expect(res.status).toBe(400);
    });

    it("6. POST /api/auth/login surfaces 401 from service", async () => {
      mockAuthService.loginUser.mockRejectedValue({ statusCode: 401, message: "Invalid credentials" });
      const res = await request(app).post("/api/auth/login").send({ email: "u6@example.com", password: "secret1" });
      expect(res.status).toBe(401);
    });

    it("7. POST /api/auth/request-password-reset returns 200", async () => {
      mockAuthService.sendResetPasswordEmail.mockResolvedValue({ _id: "u7", email: "u7@example.com" });
      const res = await request(app).post("/api/auth/request-password-reset").send({ email: "u7@example.com" });
      expect(res.status).toBe(200);
      expect(mockAuthService.sendResetPasswordEmail).toHaveBeenCalledWith("u7@example.com");
    });

    it("8. POST /api/auth/request-password-reset returns service error", async () => {
      mockAuthService.sendResetPasswordEmail.mockRejectedValue({ statusCode: 404, message: "User not found" });
      const res = await request(app).post("/api/auth/request-password-reset").send({ email: "x@example.com" });
      expect(res.status).toBe(404);
    });

    it("9. POST /api/auth/reset-password/:token returns 200", async () => {
      mockAuthService.resetPassword.mockResolvedValue({ _id: "u9" });
      const res = await request(app).post("/api/auth/reset-password/token123").send({ newPassword: "newSecret1" });
      expect(res.status).toBe(200);
      expect(mockAuthService.resetPassword).toHaveBeenCalledWith("token123", "newSecret1");
    });

    it("10. POST /api/auth/reset-password/:token returns 400 on failure", async () => {
      mockAuthService.resetPassword.mockRejectedValue({ statusCode: 400, message: "Invalid token" });
      const res = await request(app).post("/api/auth/reset-password/bad").send({ newPassword: "newSecret1" });
      expect(res.status).toBe(400);
    });
  });

  describe("Booking routes (14)", () => {
    it("11. GET /api/bookings/services returns service list", async () => {
      mockBookingService.getServices.mockResolvedValue([{ _id: "s1", title: "Cleaning" }]);
      const res = await request(app).get("/api/bookings/services");
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it("12. GET /api/bookings/services returns 500 on error", async () => {
      mockBookingService.getServices.mockRejectedValue(new Error("boom"));
      const res = await request(app).get("/api/bookings/services");
      expect(res.status).toBe(500);
    });

    it("13. POST /api/bookings requires auth", async () => {
      const res = await request(app).post("/api/bookings").send({});
      expect(res.status).toBe(401);
    });

    it("14. POST /api/bookings returns 400 for invalid payload", async () => {
      const res = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ serviceId: "", durationHours: 0.1 });
      expect(res.status).toBe(400);
    });

    it("15. POST /api/bookings returns 201 on success", async () => {
      mockBookingService.createBooking.mockResolvedValue({ _id: "b15" });
      const res = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          serviceId: "s1",
          startAt: new Date().toISOString(),
          durationHours: 1,
          address: { line1: "Street" },
        });
      expect(res.status).toBe(201);
      expect(res.body.data._id).toBe("b15");
    });

    it("16. GET /api/bookings/me requires auth", async () => {
      const res = await request(app).get("/api/bookings/me");
      expect(res.status).toBe(401);
    });

    it("17. GET /api/bookings/me returns user bookings", async () => {
      mockBookingService.myBookings.mockResolvedValue([{ _id: "b17" }]);
      const res = await request(app)
        .get("/api/bookings/me")
        .set("Authorization", `Bearer ${validToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it("18. GET /api/bookings/available returns open bookings", async () => {
      mockBookingService.getAvailableJobs.mockResolvedValue([{ _id: "b18" }]);
      const res = await request(app)
        .get("/api/bookings/available")
        .set("Authorization", `Bearer ${validToken}`);
      expect(res.status).toBe(200);
    });

    it("19. GET /api/bookings/worker/me returns worker jobs", async () => {
      mockBookingService.getWorkerJobs.mockResolvedValue([{ _id: "b19" }]);
      const res = await request(app)
        .get("/api/bookings/worker/me")
        .set("Authorization", `Bearer ${validToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data[0]._id).toBe("b19");
    });

    it("20. PATCH /api/bookings/:id/accept returns success", async () => {
      mockBookingService.acceptJob.mockResolvedValue({ _id: "b20", status: "accepted" });
      const res = await request(app)
        .patch("/api/bookings/b20/accept")
        .set("Authorization", `Bearer ${validToken}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toContain("accepted");
    });

    it("21. PATCH /api/bookings/:id/accept returns 400 on error", async () => {
      mockBookingService.acceptJob.mockRejectedValue(new Error("not available"));
      const res = await request(app)
        .patch("/api/bookings/b21/accept")
        .set("Authorization", `Bearer ${validToken}`);
      expect(res.status).toBe(400);
    });

    it("22. PATCH /api/bookings/:id/complete returns success", async () => {
      mockBookingService.completeJob.mockResolvedValue({ _id: "b22", status: "completed" });
      const res = await request(app)
        .patch("/api/bookings/b22/complete")
        .set("Authorization", `Bearer ${validToken}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toContain("completed");
    });

    it("23. GET /api/bookings returns all bookings", async () => {
      mockBookingService.getAllBookings.mockResolvedValue([{ _id: "b23" }]);
      const res = await request(app)
        .get("/api/bookings")
        .set("Authorization", `Bearer ${validToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it("24. DELETE /api/bookings/:id returns success", async () => {
      mockBookingService.deleteBooking.mockResolvedValue({ message: "Booking deleted" });
      const res = await request(app)
        .delete("/api/bookings/b24")
        .set("Authorization", `Bearer ${validToken}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Booking deleted");
    });
  });

  describe("Admin user routes (13)", () => {
    it("25. GET /api/admin/users/profile requires auth", async () => {
      const res = await request(app).get("/api/admin/users/profile");
      expect(res.status).toBe(401);
    });

    it("26. GET /api/admin/users/profile returns profile", async () => {
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: validId,
          email: "admin@example.com",
          address: "Addr",
          toObject: () => ({ _id: validId, email: "admin@example.com", address: "Addr" }),
        }),
      });

      const res = await request(app)
        .get("/api/admin/users/profile")
        .set("Authorization", `Bearer ${validToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe("admin@example.com");
    });

    it("27. GET /api/admin/users/profile returns 404 when user missing", async () => {
      mockUserModel.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
      const res = await request(app)
        .get("/api/admin/users/profile")
        .set("Authorization", `Bearer ${validToken}`);
      expect(res.status).toBe(404);
    });

    it("28. POST /api/admin/users creates user", async () => {
      mockAuthService.registerUser.mockResolvedValue({ _id: validId, email: "new@example.com" });
      const res = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          fullName: "New User",
          email: "new@example.com",
          phoneNumber: "1234567890",
          address: "Street",
          password: "secret1",
          confirmPassword: "secret1",
          role: "user",
        });
      expect(res.status).toBe(201);
    });

    it("29. POST /api/admin/users returns 400 for invalid payload", async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ email: "bad" });
      expect(res.status).toBe(400);
    });

    it("30. GET /api/admin/users returns paginated users", async () => {
      mockUserService.getAllUsers.mockResolvedValue({
        users: [{ _id: validId }],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });
      const res = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${validToken}`);
      expect(res.status).toBe(200);
      expect(res.body.pagination.total).toBe(1);
    });

    it("31. GET /api/admin/users/:id returns 400 for invalid id", async () => {
      const res = await request(app)
        .get("/api/admin/users/not-valid-id")
        .set("Authorization", `Bearer ${validToken}`);
      expect(res.status).toBe(400);
    });

    it("32. GET /api/admin/users/:id returns user", async () => {
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: validId, email: "u32@example.com" }),
      });

      const res = await request(app)
        .get(`/api/admin/users/${validId}`)
        .set("Authorization", `Bearer ${validToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data._id).toBe(validId);
    });

    it("33. GET /api/admin/users/:id returns 404 if user missing", async () => {
      mockUserModel.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
      const res = await request(app)
        .get(`/api/admin/users/${validId}`)
        .set("Authorization", `Bearer ${validToken}`);
      expect(res.status).toBe(404);
    });

    it("34. PUT /api/admin/users/:id returns 400 for invalid id", async () => {
      const res = await request(app)
        .put("/api/admin/users/not-valid-id")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ fullName: "Updated" });
      expect(res.status).toBe(400);
    });

    it("35. PUT /api/admin/users/:id updates user", async () => {
      mockAuthService.updateUser.mockResolvedValue({ _id: validId, fullName: "Updated" });
      const res = await request(app)
        .put(`/api/admin/users/${validId}`)
        .set("Authorization", `Bearer ${validToken}`)
        .send({ fullName: "Updated" });
      expect(res.status).toBe(200);
      expect(res.body.data.fullName).toBe("Updated");
    });

    it("36. DELETE /api/admin/users/:id returns 400 for invalid id", async () => {
      const res = await request(app)
        .delete("/api/admin/users/not-valid-id")
        .set("Authorization", `Bearer ${validToken}`);
      expect(res.status).toBe(400);
    });

    it("37. DELETE /api/admin/users/:id deletes user", async () => {
      mockUserModel.findByIdAndDelete.mockResolvedValue({ _id: validId });
      const res = await request(app)
        .delete(`/api/admin/users/${validId}`)
        .set("Authorization", `Bearer ${validToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

  });
});

