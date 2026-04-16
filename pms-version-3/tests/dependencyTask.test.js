const request = require("supertest");
const app = require("../app");
const { MODULE_CODE } = require("../config/config");

const BASE = "/" + MODULE_CODE + "/project/dependency-task"; // adjust if needed

describe("Dependency Task Routes", () => {

  it("POST create dependency task - invalid body", async () => {
    const res = await request(app)
      .post(`${BASE}/123`)
      .send({});
    expect(res.statusCode).toBe(422);
  });

  it("GET dependency task - invalid UUID", async () => {
    const res = await request(app).get(`${BASE}/123`);
    expect(res.statusCode).toBe( 422);
  });

  it("GET parent tasks - invalid UUID", async () => {
    const res = await request(app).get(`${BASE}/123/parent-task`);
    expect(res.statusCode).toBe( 422);
  });

  it("POST add dependency - invalid UUID", async () => {
    const res = await request(app).post(`${BASE}/123/456`);
    expect(res.statusCode).toBe(422);
  });

  it("DELETE remove dependency - invalid UUID", async () => {
    const res = await request(app).delete(`${BASE}/123/456`);
    expect(res.statusCode).toBe(422);
  });

});