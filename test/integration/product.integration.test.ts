import request from "supertest";
import app from "../../src/index";

describe("product integration placeholder", () => {
  it("unknown product route returns 404", async () => {
    const res = await request(app).get("/api/products");
    expect(res.status).toBe(404);
  });
});
