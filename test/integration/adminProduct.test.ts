import request from "supertest";
import app from "../../src/index";

describe("admin product integration placeholder", () => {
  it("unknown admin product route returns 404", async () => {
    const res = await request(app).get("/api/admin/products");
    expect(res.status).toBe(404);
  });
});
