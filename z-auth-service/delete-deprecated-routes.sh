#!/bin/bash
# ============================================================================
# DELETE DEPRECATED ROUTE FILES
# ============================================================================
# These files have been replaced by the new domain-organized route structure.
# The new files are in routes/auth/, routes/admin/, routes/organizations/, etc.
# 
# BEFORE RUNNING: Verify the server starts correctly using the new routes!
# Run: npm start
# Test: curl http://localhost:4000/auth/me (should return 401 or user data)
# ============================================================================

cd "$(dirname "$0")"

echo "🚨 This script will DELETE deprecated route files from the routes/ directory."
echo "These files have been replaced by the new domain-organized structure."
echo ""
echo "Files to delete:"
echo "  - routes/acount.route.js (replaced by routes/auth/account.routes.js)"
echo "  - routes/auth.js (replaced by routes/auth/auth.routes.js)"
echo "  - routes/security.route.js (merged into routes/auth/account.routes.js)"
echo "  - routes/realms.route.js (replaced by routes/admin/realms.routes.js)"
echo "  - routes/clients.route.js (replaced by routes/admin/clients.routes.js)"
echo "  - routes/user.route.js (replaced by routes/admin/users.routes.js)"
echo "  - routes/roles.route.js (replaced by routes/admin/roles.routes.js)"
echo "  - routes/permissions_crud.js (replaced by routes/permissions/permissions.routes.js)"
echo "  - routes/db.roles.js (replaced by routes/permissions/db-roles.routes.js)"
echo "  - routes/organizations_crud.js (replaced by routes/organizations/organizations.routes.js)"
echo "  - routes/organization_memberships_crud.js (replaced by routes/organizations/memberships.routes.js)"
echo "  - routes/org-onboarding-routes.js (replaced by routes/organizations/onboarding.routes.js)"
echo "  - routes/clientRequests.js (replaced by routes/clients/client-requests.routes.js)"
echo "  - routes/audit.route.js (replaced by routes/audit/audit.routes.js)"
echo "  - routes/admin-api.js (replaced by routes/admin/index.js)"
echo ""
read -p "Are you sure you want to delete these files? [y/N] " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Deleting deprecated route files..."
    
    rm -v routes/acount.route.js 2>/dev/null || echo "  ⚠️  acount.route.js not found"
    rm -v routes/auth.js 2>/dev/null || echo "  ⚠️  auth.js not found"
    rm -v routes/security.route.js 2>/dev/null || echo "  ⚠️  security.route.js not found"
    rm -v routes/realms.route.js 2>/dev/null || echo "  ⚠️  realms.route.js not found"
    rm -v routes/clients.route.js 2>/dev/null || echo "  ⚠️  clients.route.js not found"
    rm -v routes/user.route.js 2>/dev/null || echo "  ⚠️  user.route.js not found"
    rm -v routes/roles.route.js 2>/dev/null || echo "  ⚠️  roles.route.js not found"
    rm -v routes/permissions_crud.js 2>/dev/null || echo "  ⚠️  permissions_crud.js not found"
    rm -v routes/db.roles.js 2>/dev/null || echo "  ⚠️  db.roles.js not found"
    rm -v routes/organizations_crud.js 2>/dev/null || echo "  ⚠️  organizations_crud.js not found"
    rm -v routes/organization_memberships_crud.js 2>/dev/null || echo "  ⚠️  organization_memberships_crud.js not found"
    rm -v routes/org-onboarding-routes.js 2>/dev/null || echo "  ⚠️  org-onboarding-routes.js not found"
    rm -v routes/clientRequests.js 2>/dev/null || echo "  ⚠️  clientRequests.js not found"
    rm -v routes/audit.route.js 2>/dev/null || echo "  ⚠️  audit.route.js not found"
    rm -v routes/admin-api.js 2>/dev/null || echo "  ⚠️  admin-api.js not found"
    
    echo ""
    echo "✅ Deletion complete!"
    echo ""
    echo "Remaining route files to KEEP:"
    ls -la routes/*.js 2>/dev/null || echo "  No .js files in routes/ root"
    echo ""
    echo "Domain folders:"
    ls -d routes/*/ 2>/dev/null
else
    echo "❌ Aborted. No files were deleted."
fi
