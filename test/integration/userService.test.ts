import request from "supertest";
import app from "../../src/index";

describe("user service integration placeholder", () => {
  it("GET /api/users requires auth", async () => {
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(401);
  });
});
