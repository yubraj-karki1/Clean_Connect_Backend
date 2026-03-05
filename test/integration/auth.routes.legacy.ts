import request from "supertest";
import app from "../../src/index";

describe("Public and guard integration tests", () => {
  it("returns welcome response on GET /", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("rejects GET /api/bookings without auth", async () => {
    const res = await request(app).get("/api/bookings");
    expect(res.status).toBe(401);
  });

  it("rejects GET /api/bookings/me without auth", async () => {
    const res = await request(app).get("/api/bookings/me");
    expect(res.status).toBe(401);
  });

  it("rejects POST /api/bookings with invalid auth format", async () => {
    const res = await request(app)
      .post("/api/bookings")
      .set("Authorization", "Token abc")
      .send({});
    expect(res.status).toBe(401);
    expect(res.body.message).toContain("Bearer");
  });

  it("rejects GET /api/admin/users without auth", async () => {
    const res = await request(app).get("/api/admin/users");
    expect(res.status).toBe(401);
  });

  it("rejects GET /api/admin/users/profile with invalid token", async () => {
    const res = await request(app)
      .get("/api/admin/users/profile")
      .set("Authorization", "Bearer invalid-token");
    expect(res.status).toBe(401);
  });

  it("rejects DELETE /api/bookings/:id without auth", async () => {
    const res = await request(app).delete("/api/bookings/507f1f77bcf86cd799439011");
    expect(res.status).toBe(401);
  });

  it("returns 404 for unknown route", async () => {
    const res = await request(app).get("/api/unknown/route");
    expect(res.status).toBe(404);
  });
});
