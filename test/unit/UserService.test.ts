process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";
process.env.MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/clean-connect-test";

const mockUserRepo = {
  createUser: jest.fn(),
  getUserByEmail: jest.fn(),
  getUserByPhoneNumber: jest.fn(),
  updateUser: jest.fn(),
  updateUserById: jest.fn(),
};

const mockBookingRepo = {
  findProviderOverlap: jest.fn(),
  create: jest.fn(),
  listByUser: jest.fn(),
  findById: jest.fn(),
  deleteById: jest.fn(),
  findAll: jest.fn(),
  findByWorker: jest.fn(),
  acceptBooking: jest.fn(),
  completeBooking: jest.fn(),
};

const mockServiceModel = {
  findById: jest.fn(),
  find: jest.fn(),
};

const mockAddressModel = {
  create: jest.fn(),
};

jest.mock("../../src/repositories/auth.repository", () => ({
  UserRepository: jest.fn(() => mockUserRepo),
}));

jest.mock("../../src/repositories/booking.repository", () => ({
  BookingRepository: jest.fn(() => mockBookingRepo),
}));

jest.mock("../../src/models/service.model", () => ({
  ServiceModel: mockServiceModel,
}));

jest.mock("../../src/models/address.model", () => ({
  AddressModel: mockAddressModel,
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

jest.mock("../../src/config/email", () => ({
  sendEmail: jest.fn(),
}));

jest.mock("fs", () => ({
  existsSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendEmail } from "../../src/config/email";
import fs from "fs";
const { AuthService } = require("../../src/services/auth.service");
const { BookingService } = require("../../src/services/booking.service");
const { authorizedMiddleware } = require("../../src/middlewares/authorized.middleware");
const { CreateUserDTO, LoginUserDto } = require("../../src/dtos/user.dto");
const { CreateBookingDTO } = require("../../src/dtos/booking.dto");
const { deleteProfileImage, getProfileImagePath } = require("../../src/utils/image.utils");

describe("Unit tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("AuthService", () => {
    it("1. registerUser throws when email already exists", async () => {
      mockUserRepo.getUserByEmail.mockResolvedValue({ _id: "u1" });
      const service = new AuthService();

      await expect(
        service.registerUser({
          fullName: "A",
          email: "a@example.com",
          phoneNumber: "1234567890",
          address: "Addr",
          password: "secret1",
          confirmPassword: "secret1",
          role: "user",
        } as any)
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it("2. registerUser throws when phone number already exists", async () => {
      mockUserRepo.getUserByEmail.mockResolvedValue(null);
      mockUserRepo.getUserByPhoneNumber.mockResolvedValue({ _id: "u2" });
      const service = new AuthService();

      await expect(
        service.registerUser({
          fullName: "A",
          email: "a@example.com",
          phoneNumber: "1234567890",
          address: "Addr",
          password: "secret1",
          confirmPassword: "secret1",
          role: "user",
        } as any)
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it("3. registerUser hashes password and persists user", async () => {
      mockUserRepo.getUserByEmail.mockResolvedValue(null);
      mockUserRepo.getUserByPhoneNumber.mockResolvedValue(null);
      (bcryptjs.hash as jest.Mock).mockResolvedValue("hashed-pass");
      mockUserRepo.createUser.mockResolvedValue({ _id: "u3", email: "ok@example.com" });

      const service = new AuthService();
      const result = await service.registerUser({
        fullName: "A",
        email: "ok@example.com",
        phoneNumber: "1234567890",
        address: "Addr",
        password: "secret1",
        confirmPassword: "secret1",
        role: "user",
      } as any);

      expect(bcryptjs.hash).toHaveBeenCalledWith("secret1", 10);
      expect(mockUserRepo.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ password: "hashed-pass" })
      );
      expect(result).toEqual({ _id: "u3", email: "ok@example.com" });
    });

    it("4. loginUser throws when user does not exist", async () => {
      mockUserRepo.getUserByEmail.mockResolvedValue(null);
      const service = new AuthService();

      await expect(
        service.loginUser({ email: "none@example.com", password: "secret1" })
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it("5. loginUser throws when password is invalid", async () => {
      mockUserRepo.getUserByEmail.mockResolvedValue({ password: "stored" });
      (bcryptjs.compare as jest.Mock).mockResolvedValue(false);
      const service = new AuthService();

      await expect(
        service.loginUser({ email: "x@example.com", password: "bad" })
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it("6. loginUser returns token and user on success", async () => {
      const user = {
        _id: "u6",
        email: "ok@example.com",
        phoneNumber: "1234567890",
        role: "user",
        password: "stored",
      };
      mockUserRepo.getUserByEmail.mockResolvedValue(user);
      (bcryptjs.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue("token-123");

      const service = new AuthService();
      const result = await service.loginUser({ email: user.email, password: "secret1" });

      expect(jwt.sign).toHaveBeenCalled();
      expect(result).toEqual({ token: "token-123", user });
    });

    it("7. updateUser hashes password when provided", async () => {
      (bcryptjs.hash as jest.Mock).mockResolvedValue("hashed-new");
      mockUserRepo.updateUser.mockResolvedValue({ _id: "u7", password: "hashed-new" });
      const service = new AuthService();

      const result = await service.updateUser("u7", { password: "new-pass" });

      expect(bcryptjs.hash).toHaveBeenCalledWith("new-pass", 10);
      expect(mockUserRepo.updateUser).toHaveBeenCalledWith("u7", { password: "hashed-new" });
      expect(result).toEqual({ _id: "u7", password: "hashed-new" });
    });

    it("8. sendResetPasswordEmail throws when email missing", async () => {
      const service = new AuthService();
      await expect(service.sendResetPasswordEmail(undefined)).rejects.toMatchObject({ statusCode: 400 });
    });

    it("9. sendResetPasswordEmail sends mail and returns user", async () => {
      const user = { _id: "u9", email: "reset@example.com" };
      mockUserRepo.getUserByEmail.mockResolvedValue(user);
      (jwt.sign as jest.Mock).mockReturnValue("reset-token");
      (sendEmail as jest.Mock).mockResolvedValue(undefined);

      const service = new AuthService();
      const result = await service.sendResetPasswordEmail("reset@example.com");

      expect(sendEmail).toHaveBeenCalled();
      expect(result).toEqual(user);
    });

    it("10. resetPassword verifies token and updates hashed password", async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ id: "u10" });
      (bcryptjs.hash as jest.Mock).mockResolvedValue("hashed-reset");
      mockUserRepo.updateUserById.mockResolvedValue({ _id: "u10" });
      const service = new AuthService();

      const result = await service.resetPassword("good-token", "new-pass");

      expect(jwt.verify).toHaveBeenCalledWith("good-token", expect.any(String));
      expect(mockUserRepo.updateUserById).toHaveBeenCalledWith("u10", { password: "hashed-reset" });
      expect(result).toEqual({ _id: "u10" });
    });
  });

  describe("BookingService", () => {
    it("11. createBooking throws when service is missing", async () => {
      mockServiceModel.findById.mockResolvedValue(null);
      const service = new BookingService();

      await expect(
        service.createBooking("user1", {
          serviceId: "s1",
          startAt: new Date().toISOString(),
          durationHours: 1,
          address: { line1: "A street" },
        } as any)
      ).rejects.toThrow("Service not found or inactive");
    });

    it("12. createBooking throws for invalid date", async () => {
      mockServiceModel.findById.mockResolvedValue({ isActive: true, hourlyRate: 10 });
      const service = new BookingService();

      await expect(
        service.createBooking("user1", {
          serviceId: "s1",
          startAt: "invalid-date",
          durationHours: 1,
          address: { line1: "A street" },
        } as any)
      ).rejects.toThrow("Invalid date/time");
    });

    it("13. createBooking throws on provider overlap", async () => {
      mockServiceModel.findById.mockResolvedValue({ isActive: true, hourlyRate: 20 });
      mockBookingRepo.findProviderOverlap.mockResolvedValue({ _id: "b1" });
      const service = new BookingService();

      await expect(
        service.createBooking("user1", {
          serviceId: "s1",
          providerId: "p1",
          startAt: new Date().toISOString(),
          durationHours: 2,
          address: { line1: "A street" },
        } as any)
      ).rejects.toThrow("already booked");
    });

    it("14. createBooking computes pricing and persists booking", async () => {
      const now = new Date().toISOString();
      mockServiceModel.findById.mockResolvedValue({ isActive: true, hourlyRate: 15 });
      mockBookingRepo.findProviderOverlap.mockResolvedValue(null);
      mockAddressModel.create.mockResolvedValue({ _id: "addr1" });
      mockBookingRepo.create.mockResolvedValue({ _id: "book1" });

      const service = new BookingService();
      const result = await service.createBooking("user1", {
        serviceId: "s1",
        startAt: now,
        durationHours: 2,
        notes: "test",
        address: { line1: "A street" },
      } as any);

      expect(mockAddressModel.create).toHaveBeenCalled();
      expect(mockBookingRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user1",
          addressId: "addr1",
          pricing: expect.objectContaining({ subtotal: 30, total: 30 }),
        })
      );
      expect(result).toEqual({ _id: "book1" });
    });

    it("15. myBookings proxies to repository", async () => {
      mockBookingRepo.listByUser.mockResolvedValue([{ _id: "b15" }]);
      const service = new BookingService();
      const result = await service.myBookings("u15");
      expect(result).toEqual([{ _id: "b15" }]);
    });

    it("16. deleteBooking throws when booking not found", async () => {
      mockBookingRepo.findById.mockResolvedValue(null);
      const service = new BookingService();
      await expect(service.deleteBooking("u16", "b16")).rejects.toThrow("Booking not found");
    });

    it("17. deleteBooking throws when user is not owner", async () => {
      mockBookingRepo.findById.mockResolvedValue({ userId: { toString: () => "owner" } });
      const service = new BookingService();
      await expect(service.deleteBooking("not-owner", "b17")).rejects.toThrow("Unauthorized");
    });

    it("18. deleteBooking deletes and returns message", async () => {
      mockBookingRepo.findById.mockResolvedValue({ userId: { toString: () => "u18" } });
      mockBookingRepo.deleteById.mockResolvedValue({});
      const service = new BookingService();
      const result = await service.deleteBooking("u18", "b18");
      expect(mockBookingRepo.deleteById).toHaveBeenCalledWith("b18");
      expect(result).toEqual({ message: "Booking deleted" });
    });

    it("19. getAvailableJobs filters out closed and assigned bookings", async () => {
      mockBookingRepo.findAll.mockResolvedValue([
        { _id: "a", status: "pending_payment", providerId: null },
        { _id: "b", status: "accepted", providerId: null },
        { _id: "c", status: "pending", providerId: "worker1" },
      ]);
      const service = new BookingService();
      const result = await service.getAvailableJobs();
      expect(result).toHaveLength(1);
      expect(result[0]._id).toBe("a");
    });

    it("20. acceptJob throws when booking already assigned", async () => {
      mockBookingRepo.findById.mockResolvedValue({ providerId: "worker-x", status: "pending" });
      const service = new BookingService();
      await expect(service.acceptJob("worker-1", "b20")).rejects.toThrow("already been accepted");
    });

    it("21. acceptJob throws for unavailable status", async () => {
      mockBookingRepo.findById.mockResolvedValue({ providerId: null, status: "completed" });
      const service = new BookingService();
      await expect(service.acceptJob("worker-1", "b21")).rejects.toThrow("no longer available");
    });

    it("22. acceptJob assigns worker successfully", async () => {
      mockBookingRepo.findById.mockResolvedValue({ providerId: null, status: "pending" });
      mockBookingRepo.acceptBooking.mockResolvedValue({ _id: "b22", providerId: "worker-1" });
      const service = new BookingService();
      const result = await service.acceptJob("worker-1", "b22");
      expect(mockBookingRepo.acceptBooking).toHaveBeenCalledWith("b22", "worker-1");
      expect(result).toEqual({ _id: "b22", providerId: "worker-1" });
    });

    it("23. completeJob throws when worker is not assigned", async () => {
      mockBookingRepo.findById.mockResolvedValue({ providerId: "worker-2", status: "accepted" });
      const service = new BookingService();
      await expect(service.completeJob("worker-1", "b23")).rejects.toThrow("not assigned");
    });

    it("24. completeJob marks booking completed", async () => {
      mockBookingRepo.findById.mockResolvedValue({ providerId: { toString: () => "worker-1" }, status: "accepted" });
      mockBookingRepo.completeBooking.mockResolvedValue({ _id: "b24", status: "completed" });
      const service = new BookingService();
      const result = await service.completeJob("worker-1", "b24");
      expect(mockBookingRepo.completeBooking).toHaveBeenCalledWith("b24");
      expect(result).toEqual({ _id: "b24", status: "completed" });
    });

    it("25. getAllBookings proxies to repository", async () => {
      mockBookingRepo.findAll.mockResolvedValue([{ _id: "b25" }]);
      const service = new BookingService();
      const result = await service.getAllBookings();
      expect(result).toEqual([{ _id: "b25" }]);
    });
  });

  describe("authorizedMiddleware", () => {
    it("26. returns 401 when authorization header is missing", () => {
      const req: any = { headers: {} };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      authorizedMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it("27. returns 401 when authorization format is invalid", () => {
      const req: any = { headers: { authorization: "Token abc" } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      authorizedMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it("28. returns 401 on token verification error", () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error("bad token");
      });

      const req: any = { headers: { authorization: "Bearer bad" } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      authorizedMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it("29. attaches user and calls next when token is valid", () => {
      (jwt.verify as jest.Mock).mockReturnValue({ id: "u29", email: "u29@example.com", role: "admin" });

      const req: any = { headers: { authorization: "Bearer good" } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      authorizedMiddleware(req, res, next);

      expect(req.user).toEqual({ id: "u29", email: "u29@example.com", role: "admin" });
      expect(next).toHaveBeenCalled();
    });

    it("30. calls jwt.verify with extracted token", () => {
      (jwt.verify as jest.Mock).mockReturnValue({ id: "u30", email: "u30@example.com" });

      const req: any = { headers: { authorization: "Bearer tok-30" } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      authorizedMiddleware(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith("tok-30", expect.any(String));
      expect(next).toHaveBeenCalled();
    });
  });

});

