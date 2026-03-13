const request = require("supertest");
const app = require("../app");
const { MODULE_CODE } = require("../config/config");

const BASE = "/" + MODULE_CODE + "/project";

describe("Project Routes", () => {

  it("GET all projects", async () => {

    const res = await request(app).get(BASE);
    expect([200, 401]).toContain(res.statusCode);
  });

});