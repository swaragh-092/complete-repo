const request = require("supertest");
const app = require("../app"); // your express app export

describe("Health Check API", () => {

  it("should return 200 and health data", async () => {
    const res = await request(app).get("/health");

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("status", "ok");
    expect(res.body).toHaveProperty("uptime");
    expect(res.body).toHaveProperty("timestamp");
  });

});