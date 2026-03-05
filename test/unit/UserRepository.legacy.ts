const mockUserModel = {
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
};

const save = jest.fn();

jest.mock("../../src/models/user.model", () => ({
  UserModel: Object.assign(
    jest.fn().mockImplementation(() => ({ save })),
    mockUserModel
  ),
}));

import { UserRepository } from "../../src/repositories/auth.repository";

describe("UserRepository unit tests", () => {
  beforeEach(() => jest.clearAllMocks());

  it("getUserByEmail delegates to UserModel.findOne", async () => {
    mockUserModel.findOne.mockResolvedValue({ email: "a@example.com" });
    const repo = new UserRepository();
    const user = await repo.getUserByEmail("a@example.com");
    expect(user?.email).toBe("a@example.com");
  });
});
