import { PORT } from "../../src/config";

describe("index/config unit tests", () => {
  it("exports a valid numeric PORT", () => {
    expect(typeof PORT).toBe("number");
    expect(PORT).toBeGreaterThan(0);
  });
});
