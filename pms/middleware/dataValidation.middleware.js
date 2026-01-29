// Author: Gururaj
// Created: 14th oct 2025
// Description: Middleware for valididation of user and has access will be checked here and organization id is added (so that during db operations it gets used).
// Version: 1.0.0

const Response = require("../services/Response");
const { namespace } = require("../config/cls");
const { domain, moduleCode } = require("../config/config");
const redis = require("../config/redisConnection");

const dataValidation = async (req, res, next) => {
  try {
    // validation logic will come here.

    // const authenticate = await fetch(`${domain.auth}/api/auth/validate-token`);

    const authenticate = {
      ok: true,
      json: async () => ({
        organization_id: "org_12345",
        user: {
          id: "user_12345",
          name: "John Doe",
        },
      }),
    };

    if (!authenticate.ok) {
      return Response.apiResponse({
        res,
        success: false,
        status: 401,
      });
    }

    // const authData = await authenticate.json();
    const authData = {
      organization_id: "4ca3ec85-fdb8-4d62-955d-d7d17269a7f2",
      user: {
        id: "user_12345",
        name: "John Doe",
      },
    };
    req.organization_id = authData.organization_id;
    req.user = authData.user;

    const subdomain = req.headers.host.split(".")[0];
    req.tenantConfig = await getRequiredData(subdomain, moduleCode, req);

    namespace.run(() => {
      namespace.set("organization_id", req.organization_id);
      next();
    });
  } catch (err) {
    console.log(err);
    return Response.apiResponse({
      res,
      success: false,
      status: err.status || 500,
      message: err.message || "Internal Server Error",
    });
  }
};

module.exports = dataValidation;

async function getRequiredData(subdomain, moduleCode, req) {
  const cacheKey = `app_config:${req.organization_id}:${subdomain}:${moduleCode}`;

  //  Try Redis first
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  // Call Super Admin (only on cache miss)
  const response = await fetch(
    `${domain.superAdmin}/api/required-data/${req.organization_id}/${subdomain}/${moduleCode}`,
  );

  let data;
  
  try {
    data = await response.json();
    console.log(data);
  } catch {
    throw {
      status: response.status || 500,
      message: "Invalid response from Super Admin",
    };
  }

  if (!response.ok) {
    throw {
      status: response.status,
      message: data?.message || "Super Admin error",
    };
  }

  await redis.set(cacheKey, JSON.stringify(data));
  return data;
}
