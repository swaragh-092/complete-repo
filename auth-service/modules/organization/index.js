const organizationsRoutes = require('./routes/organizations.routes');
const membershipsRoutes = require('./routes/memberships.routes');
const onboardingRoutes = require('./routes/onboarding.routes');
const workspacesRoutes = require('./routes/workspaces.routes');
const settingsRoutes = require('./routes/settings.routes');
const requestsRoutes = require('./routes/requests.routes');

module.exports = {
    crud: organizationsRoutes,
    memberships: membershipsRoutes,
    onboarding: onboardingRoutes,
    workspaces: workspacesRoutes,
    settings: settingsRoutes,
    requests: requestsRoutes
};
