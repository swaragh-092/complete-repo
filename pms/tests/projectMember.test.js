const request = require("supertest");
const app = require("../app");
const { MODULE_CODE } = require("../config/config");

const BASE = "/" + MODULE_CODE + "/project/member";

describe("Project Member Routes", () => {

  it("GET invalid project member", async () => {
    const res = await request(app).get(`${BASE}/123`);
    expect(res.statusCode).toBe(422);
  });

});