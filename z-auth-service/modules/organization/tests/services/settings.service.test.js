'use strict';

const SettingsService = require('../../services/settings.service');
const { GlobalSetting, Organization } = require('../../../../config/database');
const { AppError } = require('../../../../middleware/errorHandler');

jest.mock('../../../../config/database', () => ({
    GlobalSetting: {
        findOne: jest.fn(),
        findAll: jest.fn(),
        create: jest.fn()
    },
    Organization: {
        findByPk: jest.fn(),
        update: jest.fn()
    }
}));

describe('SettingsService', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('resolveSetting()', () => {
        it('1. should resolve from Org settings if present', async () => {
            Organization.findByPk.mockResolvedValue({
                settings: { max_workspaces_per_org: 20 }
            });

            const result = await SettingsService.resolveSetting('org-123', 'MAX_WORKSPACES_PER_ORG', 5);
            expect(result).toBe(20);
            expect(Organization.findByPk).toHaveBeenCalledWith('org-123', { attributes: ['settings'] });
            expect(GlobalSetting.findOne).not.toHaveBeenCalled();
        });

        it('2. should fallback to GlobalSetting if Org setting is absent', async () => {
            Organization.findByPk.mockResolvedValue({ settings: {} });
            GlobalSetting.findOne.mockResolvedValue({ value: '15', type: 'number' });

            const result = await SettingsService.resolveSetting('org-123', 'MAX_WORKSPACES_PER_ORG', 5);
            expect(result).toBe(15);
            expect(GlobalSetting.findOne).toHaveBeenCalledWith({ where: { key: 'MAX_WORKSPACES_PER_ORG', is_active: true } });
        });

        it('3. should fallback to systemFallback if neither present', async () => {
            Organization.findByPk.mockResolvedValue(null);
            GlobalSetting.findOne.mockResolvedValue(null);

            const result = await SettingsService.resolveSetting('org-123', 'MAX_WORKSPACES_PER_ORG', 5);
            expect(result).toBe(5);
        });

        it('4. should correctly parse booleans', async () => {
            Organization.findByPk.mockResolvedValue(null);
            GlobalSetting.findOne.mockResolvedValue({ value: 'true', type: 'boolean' });

            const result = await SettingsService.resolveSetting(null, 'ENABLE_2FA', false);
            expect(result).toBe(true);
        });

        it('5. should correctly parse JSON', async () => {
            Organization.findByPk.mockResolvedValue(null);
            GlobalSetting.findOne.mockResolvedValue({ value: '{"domains":["test.com"]}', type: 'json' });

            const result = await SettingsService.resolveSetting(null, 'DOMAINS', {});
            expect(result).toEqual({ domains: ['test.com'] });
        });
    });

    describe('upsertGlobalSetting()', () => {
        it('should create a new setting if not exists', async () => {
            GlobalSetting.findOne.mockResolvedValue(null);
            GlobalSetting.create.mockResolvedValue({ id: 'set-1', key: 'TEST' });

            const result = await SettingsService.upsertGlobalSetting({ key: 'TEST', value: 'value1', userId: 'user-1' });
            expect(GlobalSetting.create).toHaveBeenCalledWith(expect.objectContaining({
                key: 'TEST',
                value: 'value1',
                type: 'string',
                category: 'system',
                is_system: false,
                updated_by: 'user-1'
            }));
        });

        it('should update an existing setting', async () => {
            const mockSetting = { is_system: false, update: jest.fn() };
            GlobalSetting.findOne.mockResolvedValue(mockSetting);

            await SettingsService.upsertGlobalSetting({ key: 'TEST', value: 'value2', type: 'number', userId: 'user-1' });
            expect(mockSetting.update).toHaveBeenCalledWith(expect.objectContaining({
                value: 'value2',
                updated_by: 'user-1'
            }));
        });

        it('should prevent changing type of a system setting', async () => {
            const mockSetting = { is_system: true, type: 'number', update: jest.fn() };
            GlobalSetting.findOne.mockResolvedValue(mockSetting);

            await expect(SettingsService.upsertGlobalSetting({ key: 'MAX_W', value: '10', type: 'string' }))
                .rejects.toThrow(AppError);
        });
    });

    describe('updateOrgSettings()', () => {
        it('should merge new settings and delete null fields for an organization', async () => {
            const mockOrg = {
                settings: { max_users: 100, custom_domain: 'abc.com' },
                update: jest.fn()
            };
            Organization.findByPk.mockResolvedValue(mockOrg);

            await SettingsService.updateOrgSettings('org-1', { max_users: 200, custom_domain: null, new_flag: true });

            expect(mockOrg.update).toHaveBeenCalledWith({
                settings: {
                    max_users: 200,
                    new_flag: true
                    // custom_domain should be deleted because it was passed as null
                }
            });
        });

        it('should throw error if org is not found', async () => {
            Organization.findByPk.mockResolvedValue(null);

            await expect(SettingsService.updateOrgSettings('org-1', { a: 1 }))
                .rejects.toThrow(AppError);
        });
    });

});
