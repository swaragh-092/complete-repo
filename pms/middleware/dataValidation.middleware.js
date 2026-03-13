// Author: Gururaj
// Created: 14th oct 2025
// Description: Middleware for valididation of user and has access will be checked here and organization id is added (so that during db operations it gets used).
// Version: 1.0.0

const Response = require("../services/Response");
const { namespace } = require("../config/cls");
const { DOMAIN, MODULE_CODE } = require("../config/config");
const { getRedis } = require("../config/redisConnection");

const dataValidation = async (req, res, next) => {
  try {
    // Extract access token from cookies or Authorization header
    const accessToken =
      req.cookies?.access_token ||
      req.headers.authorization?.replace("Bearer ", "");

    if (!accessToken) {
      return Response.apiResponse({
        res,
        success: false,
        status: 401,
        message: "No access token provided. Please login.",
      });
    }

    // Call auth-service to validate token and get user data
    const authenticate = await fetch(`${DOMAIN.auth}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!authenticate.ok) {
      console.error(
        "Auth validation failed:",
        authenticate.status,
        authenticate.statusText,
      );
      return Response.apiResponse({
        res,
        success: false,
        status: 401,
        message: "Invalid or expired token. Please login again.",
      });
    }

    const authData = await authenticate.json();

    // organizations is { primaryOrganization, memberships, totalOrganizations } from /auth/me
    const organization_id =
      authData.organizations?.primaryOrganization?.id ||
      authData.organizations?.memberships?.[0]?.organization?.id ||
      authData.organizations?.[0]?.id || // fallback: authMiddleware array format
      authData.organizations?.[0]?.organization?.id ||
      authData.tenant_id;

    console.log(
      "🏢 org context:",
      JSON.stringify(authData.organizations),
      "→ org_id:",
      organization_id,
    );

    // Get user ID from DB (auth-service returns id = UserMetadata.id)
    const userId = authData.id || authData.sub;

    req.organization_id = organization_id;
    req.user = {
      id: userId,
      keycloak_id: authData.sub,
      sub: authData.sub,
      email: authData.email,
      name: authData.name,
      preferred_username: authData.preferred_username,
      roles: authData.roles || [],
      client_id: authData.client_id,
      tenant_id: authData.tenant_id,
      organizations: authData.organizations || [],
    };

    console.log("✅ User authenticated:", req.user.email, "ID:", req.user.id);

    // Extract subdomain from host header
    const subdomain = req.headers.host?.split(".")[0] || "final-fn-pms";

    req.tenantConfig = await getRequiredData(subdomain, MODULE_CODE, req);

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
  const redis = getRedis();
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  console.log(
    `${DOMAIN.superAdmin}/api/required-data/${req.organization_id}/${subdomain}/${moduleCode}`,
  );
  // Call Super Admin (only on cache miss)
  let response;
  // try {
  //   response = await fetch(
  //     `${DOMAIN.superAdmin}/api/required-data/${req.organization_id}/${subdomain}/${moduleCode}`,
  //   );
  // } catch (err) {
  // console.log(err);
  return {}; // todo - handle super admin down scenario gracefully, maybe return default config or an error message indicating the issue.
  // }
  console.log(response);

  let data;

  try {
    data = await response.json();
    // console.log(data);
  } catch {
    throw {
      status: response.status || 500,
      message: "Invalid response from Super Admin",
    };
  }

  if (!response.ok) {
    throw {
      status: response.status,
      message: "Admin: " + data?.message || "Super Admin error",
    };
  }

  await redis.set(cacheKey, JSON.stringify(data));
  return data;
}
