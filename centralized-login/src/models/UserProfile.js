export function mapUserProfile(raw) {
  if (!raw) return null;

  const metadata = raw.metadata || {};
  const memberships = metadata.memberships || [];
  const organizations = metadata.primary_organization
    ? [metadata.primary_organization]
    : [];

  const flattenedPermissions = memberships.flatMap((membership) =>
    (membership.role?.permissions || []).map((permission) => ({
      id: permission.id,
      name: permission.name,
      resource: permission.resource,
      action: permission.action,
      organizationId: membership.organization?.id || null,
    }))
  );
  const permissionStrings = flattenedPermissions.map(
    (permission) => `${permission.resource || 'global'}:${permission.action || permission.name}`
  );

  return {
    id: raw.id,
    username: raw.username,
    email: raw.email,
    firstName: raw.firstName || '',
    lastName: raw.lastName || '',
    fullName: `${raw.firstName || ''} ${raw.lastName || ''}`.trim() || raw.username,
    gender: metadata.gender || raw.gender || 'unspecified',
    enabled: Boolean(raw.enabled ?? metadata.is_active),
    emailVerified: Boolean(raw.emailVerified),
    avatarUrl: metadata.avatar_url || raw.avatar_url || null,
    createdAt: raw.createdTimestamp ? new Date(raw.createdTimestamp) : null,
    lastLogin: metadata.last_login ? new Date(metadata.last_login) : null,

    metadata: {
      department: metadata.department || '',
      designation: metadata.designation || '',
      mobile: metadata.mobile || metadata.phone || '',
      bio: metadata.bio || raw.attributes?.bio?.[0] || '',
      isActive: metadata.is_active ?? Boolean(raw.enabled),
      primaryOrganization: metadata.primary_organization || null,
    },

    memberships: memberships.map((membership) => ({
      id: membership.id,
      orgId: membership.organization?.id,
      orgName: membership.organization?.name,
      tenantId: membership.organization?.tenant_id,
      roleName: membership.role?.name,
      roleDescription: membership.role?.description,
      permissions: (membership.role?.permissions || []).map((permission) => ({
        id: permission.id,
        name: permission.name,
        resource: permission.resource,
        action: permission.action,
      })),
    })),

    organizations: organizations.map((org) => ({
      id: org.id,
      name: org.name,
      tenantId: org.tenant_id,
    })),

    roles: raw.authorization?.database_roles || raw.roles || [],
    keycloakRoles: raw.authorization?.keycloak_roles || raw.kc_roles || [],
    permissions: permissionStrings,
    permissionDetails: flattenedPermissions,
    connectedAccounts: raw.connectedAccounts || [],
    authorizationContext: {
      permissionsByOrganization: metadata.memberships?.reduce((acc, membership) => {
        if (!membership.organization?.id) return acc;
        acc[membership.organization.id] = (membership.role?.permissions || []).map((permission) => ({
          name: permission.name,
          resource: permission.resource,
          action: permission.action,
        }));
        return acc;
      }, {}) || {},
      raw: raw.authorization || {},
    },
    totpEnabled: Boolean(raw.totp || raw.attributes?.twoFactorEnabled?.[0] === 'true'),
    lastLoginProvider: raw.lastLoginProvider || metadata.lastLoginProvider || null,
    lastLoginIp: raw.lastLoginIp || metadata.lastLoginIp || null,
  };
}
