jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({ sendMail: jest.fn().mockResolvedValue({}) })),
}));

import { sendEmail } from "../../src/config/email";

describe("email unit tests", () => {
  it("sendEmail resolves for valid payload", async () => {
    await expect(sendEmail("x@example.com", "Hello", "<p>Hi</p>")).resolves.toBeUndefined();
  });
});
