import request from "supertest";
import app from "../../src/index";

describe("order integration placeholder", () => {
  it("unknown order route returns 404", async () => {
    const res = await request(app).get("/api/orders");
    expect(res.status).toBe(404);
  });
});
