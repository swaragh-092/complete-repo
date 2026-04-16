const request = require("supertest");
const app = require("../app");
const { MODULE_CODE } = require("../config/config");

const BASE = "/" + MODULE_CODE + "/issue";

describe("Issue Routes", () => {

  it("GET issue types", async () => {
    const res = await request(app).get(`${BASE}/types`);
    expect([200, 401]).toContain(res.statusCode);
  });

});