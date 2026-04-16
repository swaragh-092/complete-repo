const request = require("supertest");
const app = require("../app");
const { MODULE_CODE } = require("../config/config");

const BASE = "/" + MODULE_CODE + "/project/task"; // adjust if needed

describe("Task Routes", () => {

  it("GET my ongoing or pending tasks", async () => {
    const res = await request(app)
      .get(`${BASE}/my-task/on_going_or_pending`);
    expect([200, 401]).toContain(res.statusCode);
  });

  it("GET my tasks by invalid status", async () => {
    const res = await request(app)
      .get(`${BASE}/my-task/invalid_status`);
    expect(res.statusCode).toBe(422);
  });

  it("POST create task - invalid body", async () => {
    const res = await request(app)
      .post(`${BASE}/123`)
      .send({});
    expect(res.statusCode).toBe(422);
  });

  it("DELETE task - invalid UUID", async () => {
    const res = await request(app)
      .delete(`${BASE}/123`);
    expect(res.statusCode).toBe(422);
  });

  it("PUT complete task - invalid UUID", async () => {
    const res = await request(app)
      .put(`${BASE}/123/complete`);
    expect(res.statusCode).toBe(422);
  });

});