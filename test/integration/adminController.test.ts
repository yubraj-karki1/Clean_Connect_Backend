import request from "supertest";
import app from "../../src/index";

describe("admin controller integration", () => {
  it("GET /api/admin/users/profile rejects invalid token", async () => {
    const res = await request(app)
      .get("/api/admin/users/profile")
      .set("Authorization", "Bearer invalid");
    expect(res.status).toBe(401);
  });
});
