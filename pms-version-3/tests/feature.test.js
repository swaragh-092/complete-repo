const request = require("supertest");
const app = require("../app");
const { MODULE_CODE } = require("../config/config");

const BASE = "/" + MODULE_CODE + "/feature";

describe("Feature Routes", () => {

  it("GET feature by invalid id", async () => {
    const res = await request(app).get(`${BASE}/123`);
    expect(res.statusCode).toBe(422);
  });

});