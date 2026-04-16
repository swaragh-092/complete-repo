const request = require("supertest");
const app = require("../app");
const { MODULE_CODE } = require("../config/config");

const BASE = "/" + MODULE_CODE + "/checklist";

describe("Checklist Routes", () => {

  it("GET checklist by invalid id", async () => {
    const res = await request(app).get(`${BASE}/123`);
    expect(res.statusCode).toBe(404);
  });

});