import api, { extractData } from './api';

const BASE_URL = '/workspaces';

const workspaceService = {
    /**
     * Get all workspaces for the current user
     * @param {string} [orgId] - Optional organization ID to filter by
     */
    getAll: async (orgId) => {
        const params = orgId ? { org_id: orgId } : {};
        const res = await api.get(BASE_URL, { params });
        return extractData(res);
    },

    /**
     * Get workspace details by ID
     * @param {string} id - Workspace ID
     */
    getById: async (id) => {
        const res = await api.get(`${BASE_URL}/${id}`);
        return extractData(res);
    },

    /**
     * Create a new workspace
     * @param {Object} data - { org_id, name, slug, description }
     */
    create: async (data) => {
        const res = await api.post(BASE_URL, data);
        return extractData(res);
    },

    /**
     * Add a member to the workspace
     * @param {string} workspaceId
     * @param {Object} data - { user_id, role }
     */
    addMember: async (workspaceId, data) => {
        const res = await api.post(`${BASE_URL}/${workspaceId}/members`, data);
        return extractData(res);
    },

    /**
     * Get workspace members
     * @param {string} workspaceId
     */
    getMembers: async (workspaceId) => {
        const res = await api.get(`${BASE_URL}/${workspaceId}/members`);
        return extractData(res);
    },

    /**
     * Remove a member from workspace
     * @param {string} workspaceId
     * @param {string} userId
     */
    removeMember: async (workspaceId, userId) => {
        const res = await api.delete(`${BASE_URL}/${workspaceId}/members/${userId}`);
        return extractData(res);
    },

    /**
     * Update workspace details
     * @param {string} id
     * @param {Object} data - { name, description }
     */
    update: async (id, data) => {
        const res = await api.put(`${BASE_URL}/${id}`, data);
        return extractData(res);
    },

    /**
     * Delete workspace (soft delete)
     * @param {string} id
     */
    delete: async (id) => {
        const res = await api.delete(`${BASE_URL}/${id}`);
        return extractData(res);
    },

    /**
     * Update member role
     * @param {string} workspaceId
     * @param {string} userId
     * @param {string} role
     */
    updateMemberRole: async (workspaceId, userId, role) => {
        const res = await api.put(`${BASE_URL}/${workspaceId}/members/${userId}`, { role });
        return extractData(res);
    },

    // ============== INVITATION METHODS ==============

    /**
     * Send workspace invitation by email
     */
    sendInvitation: async (workspaceId, data) => {
        const res = await api.post(`${BASE_URL}/${workspaceId}/invitations`, data);
        return extractData(res);
    },

    /**
     * Get pending invitations
     */
    getInvitations: async (workspaceId) => {
        const res = await api.get(`${BASE_URL}/${workspaceId}/invitations`);
        return extractData(res);
    },

    /**
     * Revoke invitation
     */
    revokeInvitation: async (workspaceId, invitationId) => {
        const res = await api.delete(`${BASE_URL}/${workspaceId}/invitations/${invitationId}`);
        return extractData(res);
    },

    /**
     * Preview invitation details (before accepting)
     */
    previewInvitation: async (code) => {
        const res = await api.get(`${BASE_URL}/invitations/preview`, { params: { code } });
        return extractData(res);
    },

    /**
     * Accept workspace invitation
     */
    acceptInvitation: async (code) => {
        const res = await api.post(`${BASE_URL}/invitations/accept`, { code });
        return extractData(res);
    }
};

export default workspaceService;
