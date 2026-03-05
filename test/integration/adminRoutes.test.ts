import request from "supertest";
import app from "../../src/index";

describe("admin routes integration", () => {
  it("GET /api/admin/users requires auth", async () => {
    const res = await request(app).get("/api/admin/users");
    expect(res.status).toBe(401);
  });
});
