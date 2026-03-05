import request from "supertest";
import app from "../../src/index";

describe("app integration", () => {
  it("GET / returns welcome", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
