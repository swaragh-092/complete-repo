const KeycloakService = require('./services/keycloak.service');

async function setupRoles() {
  const keycloakService = new KeycloakService('my-projects'); // Replace with your realm
  await keycloakService.initialize();
  
  // Create superadmin role for admin-ui client
  await keycloakService.createClientRole('admin-ui', 'superadmin', 'Super admin role with full access');
//   logger.info('Superadmin role setup complete');
  console.info('Superadmin role setup complete');
}

setupRoles().catch(err => {
//   logger.error('Failed to setup roles:', err);
console.error('Failed to setup roles:', err);
  process.exit(1);
});