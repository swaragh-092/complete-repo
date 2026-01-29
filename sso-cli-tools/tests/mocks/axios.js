/**
 * Mock implementations for axios
 * Used in tests to simulate API responses
 */

export const mockAxios = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    create: vi.fn(() => mockAxios),
};

/**
 * Reset all mocks between tests
 */
export function resetMocks() {
    mockAxios.get.mockReset();
    mockAxios.post.mockReset();
    mockAxios.put.mockReset();
    mockAxios.delete.mockReset();
}

/**
 * Create a successful response mock
 * @param {any} data - Response data
 * @returns {Promise<{status: number, data: any}>}
 */
export function mockSuccess(data) {
    return Promise.resolve({ status: 200, data });
}

/**
 * Create an error response mock
 * @param {number} status - HTTP status code
 * @param {string} message - Error message
 * @returns {Promise<never>}
 */
export function mockError(status, message) {
    const error = new Error(message);
    error.response = { status, data: { message } };
    return Promise.reject(error);
}
