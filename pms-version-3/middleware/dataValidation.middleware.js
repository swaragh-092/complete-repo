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

    const start = performance.now();

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

    const end = performance.now();

    console.log(`API took ${end - start} ms for auth-service /auth/me validation`);

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

    const startagain = performance.now();

    req.tenantConfig = await getRequiredData(subdomain, MODULE_CODE, req);

    const endagain = performance.now();
 
    console.log(`API took ${endagain - startagain} ms for tenant config fetch for super admin`);      

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

  return {};

  //  Try Redis first
  const redis = getRedis();
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const superAdminUrl = `${DOMAIN.superAdmin}/api/required-data/${req.organization_id}/${subdomain}/${moduleCode}`;
  console.log(`Fetching tenant config from Super Admin: ${superAdminUrl}`);

  // Call Super Admin service (only on Redis cache miss)
  let response;
  try {
    
    response = await fetch(superAdminUrl);
  } catch (err) {
    // Super Admin service is unreachable (network error, service down, etc.)
    // Log a warning and return an empty config so the request can still proceed
    // with default/fallback behaviour rather than failing the entire request.
    console.warn(
      `[dataValidation] Super Admin service unreachable at ${superAdminUrl}. ` +
        `Proceeding with empty tenant config. Error: ${err.message}`,
    );
    return {};
  }

  let data;

  try {
    data = await response.json();
  } catch {
    throw {
      status: response.status || 500,
      message: "Invalid response from Super Admin",
    };
  }

  if (!response.ok) {
    // Super Admin returned a non-2xx status. Log and fall back gracefully
    // instead of hard-failing the entire request pipeline.
    console.warn(
      `[dataValidation] Super Admin returned ${response.status}. ` +
        `Message: ${data?.message || "No message"}. Continuing with empty config.`,
    );
    return {};
  }

  // Persist the successful response in Redis for subsequent requests
  await redis.set(cacheKey, JSON.stringify(data));
  return data;
}
