import { HttpError } from "../../src/errors/http-error";
import { userSchema } from "../../src/types/user.types";
import { CreateUserDTO, LoginUserDto } from "../../src/dtos/user.dto";
import { CreateBookingDTO } from "../../src/dtos/booking.dto";
import { deleteProfileImage, getProfileImagePath } from "../../src/utils/image.utils";
import fs from "fs";

jest.mock("fs", () => ({
  existsSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

describe("Schema and utility unit tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates HttpError with status and message", () => {
    const error = new HttpError(422, "Validation failed");
    expect(error.statusCode).toBe(422);
    expect(error.message).toBe("Validation failed");
  });

  it("userSchema accepts valid user payload", () => {
    const result = userSchema.safeParse({
      fullName: "Schema User",
      email: "schema@example.com",
      address: "Street",
      phoneNumber: "1234567890",
      password: "secret1",
      role: "user",
    });
    expect(result.success).toBe(true);
  });

  it("userSchema rejects invalid phone number length", () => {
    const result = userSchema.safeParse({
      fullName: "Schema User",
      email: "schema@example.com",
      address: "Street",
      phoneNumber: "123",
      password: "secret1",
      role: "user",
    });
    expect(result.success).toBe(false);
  });

  it("CreateUserDTO accepts matching passwords", () => {
    const result = CreateUserDTO.safeParse({
      fullName: "DTO User",
      email: "dto@example.com",
      phoneNumber: "1234567890",
      address: "Street",
      password: "secret1",
      confirmPassword: "secret1",
      role: "admin",
    });
    expect(result.success).toBe(true);
  });

  it("LoginUserDto rejects short password", () => {
    const result = LoginUserDto.safeParse({
      email: "dto@example.com",
      password: "123",
    });
    expect(result.success).toBe(false);
  });

  it("CreateBookingDTO accepts valid booking payload", () => {
    const result = CreateBookingDTO.safeParse({
      serviceId: "service-1",
      startAt: new Date().toISOString(),
      durationHours: 1.5,
      address: { line1: "Kathmandu" },
      notes: "window cleaning",
    });
    expect(result.success).toBe(true);
  });

  it("getProfileImagePath returns profile upload path", () => {
    const result = getProfileImagePath("avatar.jpg");
    expect(result).toContain("uploads");
    expect(result).toContain("profile");
    expect(result).toContain("avatar.jpg");
  });

  it("deleteProfileImage returns false when file does not exist", () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    const result = deleteProfileImage("missing.jpg");
    expect(result).toBe(false);
    expect(fs.unlinkSync).not.toHaveBeenCalled();
  });
});
