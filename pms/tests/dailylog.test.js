const request = require("supertest");
const app = require("../app");
const { MODULE_CODE } = require("../config/config");

const BASE = "/" + MODULE_CODE + "/dailylog";

describe("Daily Log Routes", () => {

  it("GET all daily logs", async () => {
    const res = await request(app).get(BASE);
    expect([200, 400, 401]).toContain(res.statusCode);
  });

  it("GET non-standup tasks", async () => {
    const res = await request(app).get(`${BASE}/non-stnadup-tasks`);
    expect([200, 401]).toContain(res.statusCode);
  });

  it("POST create standup (invalid body)", async () => {
    const res = await request(app)
      .post(`${BASE}/task/create`)
      .send({});

    expect(res.statusCode).toBe(422);
  });

});