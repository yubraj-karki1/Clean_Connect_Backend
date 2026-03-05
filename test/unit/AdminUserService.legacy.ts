jest.mock("../../src/models/user.model", () => ({
  UserModel: {
    countDocuments: jest.fn(),
    find: jest.fn(),
  },
}));

import { UserModel } from "../../src/models/user.model";
import { UserService } from "../../src/services/admin/user.service";

describe("AdminUserService unit tests", () => {
  beforeEach(() => jest.clearAllMocks());

  it("getAllUsers returns paginated payload", async () => {
    (UserModel.countDocuments as jest.Mock).mockResolvedValue(1);
    (UserModel.find as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([{ _id: "u1" }]),
        }),
      }),
    });

    const service = new UserService();
    const res = await service.getAllUsers(1, 10);
    expect(res.pagination.total).toBe(1);
    expect(res.users).toHaveLength(1);
  });
});
