import request from "supertest";
import app from "../../src/index";

describe("admin user service integration", () => {
  it("GET /api/admin/users/:id rejects malformed id", async () => {
    const res = await request(app)
      .get("/api/admin/users/bad-id")
      .set("Authorization", "Bearer invalid");
    expect([400, 401]).toContain(res.status);
  });
});
