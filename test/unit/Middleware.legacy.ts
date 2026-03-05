import { authorizedMiddleware } from "../../src/middlewares/authorized.middleware";

describe("Middleware unit tests", () => {
  it("returns 401 when authorization header is missing", () => {
    const req: any = { headers: {} };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    authorizedMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
