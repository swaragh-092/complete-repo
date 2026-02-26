const request = require("supertest");
const app = require("../app");
const { MODULE_CODE } = require("../config/config");

const BASE = "/" + MODULE_CODE + "/project/helper-task"; // adjust if needed

describe("Helper Task Routes", () => {

  it("POST create helper task - invalid body", async () => {
    const res = await request(app)
      .post(`${BASE}/123`)
      .send({});
    expect(res.statusCode).toBe(422);
  });

  it("POST accept/reject helper - invalid UUID", async () => {
    const res = await request(app)
      .post(`${BASE}/accept/123/accept`);
    expect(res.statusCode).toBe(422);
  });

  it("GET acceptable tasks", async () => {
    const res = await request(app).get(`${BASE}/accept`);
    expect([200, 401, 422]).toContain(res.statusCode);
  });

  it("PUT add helper task - invalid UUID", async () => {
    const res = await request(app).put(`${BASE}/123/456`);
    expect(res.statusCode).toBe(422);
  });

  it("DELETE remove helper task - invalid UUID", async () => {
    const res = await request(app).delete(`${BASE}/123/456`);
    expect(res.statusCode).toBe(422);
  });

});