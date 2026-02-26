const request = require("supertest");
const app = require("../app");
const { MODULE_CODE } = require("../config/config");

const BASE = "/" + MODULE_CODE + "/work"; // adjust if needed

describe("Task Workflow Routes", () => {

  it("POST start task - invalid UUID", async () => {
    const res = await request(app)
      .post(`${BASE}/123/start`);
    expect(res.statusCode).toBe(422);
  });

  it("DELETE end tasks", async () => {
    const res = await request(app)
      .delete(`${BASE}/end`);
    expect([200, 401]).toContain(res.statusCode);
  });

  it("GET current working task", async () => {
    const res = await request(app)
      .get(`${BASE}/current`);
    expect([200, 401]).toContain(res.statusCode);
  });

});