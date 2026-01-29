export const ENV = {
    API_URL: import.meta.env.VITE_API_URL ?? '/auth',
    KEYCLOAK_URL: import.meta.env.VITE_KEYCLOAK_URL ?? '',
    NODE_ENV: import.meta.env.MODE ?? 'development',
};