/**
 * TypeScript type definitions for @spidy092/sso-client-cli
 */

/**
 * Client configuration from the backend API
 */
export interface ClientConfig {
    client_key: string;
    client_id: string;
    name: string;
    redirect_url: string;
    callback_url: string;
    requires_organization: boolean;
    organization_model: 'single' | 'multi' | 'workspace' | 'enterprise' | null;
    onboarding_flow: 'create_org' | 'invitation_only' | 'domain_matching' | 'flexible' | null;
    realm: string;
    realm_display: string;
    description: string;
    icon: string;
    primary_color: string;
    created_at: string;
}

/**
 * Client registration request
 */
export interface ClientRequest {
    id: number;
    client_key: string;
    app_name: string;
    redirect_url: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    approved_at?: string;
    rejection_reason?: string;
}

/**
 * SSO URL configuration
 */
export interface SSOConfig {
    protocol: 'http' | 'https';
    domain: string;
    authServicePort: number;
    accountUiPort: number;
    authServiceUrl: () => string;
    accountUiUrl: () => string;
    getClientUrl: (clientKey: string, port: number) => string;
    getRedirectUrl: (clientKey: string, port: number) => string;
    getCallbackUrl: (clientKey: string) => string;
}

/**
 * Template variables for file generation
 */
export interface TemplateVariables {
    CLIENT_KEY: string;
    APP_NAME: string;
    PORT: number;
    SSO_URL: string;
    REDIRECT_URL: string;
    CALLBACK_URL: string;
    REQUIRES_ORGANIZATION: boolean;
    ORGANIZATION_MODEL: string;
    ONBOARDING_FLOW: string;
}

/**
 * Auth API service interface
 */
export interface AuthApiService {
    getClientStatus: (clientKey: string) => Promise<{ request: ClientRequest }>;
    getClientConfig: (clientKey: string) => Promise<ClientConfig>;
    registerClient: (data: {
        client_key: string;
        app_name: string;
        redirect_url: string;
        callback_url: string;
        realm: string;
        requires_organization?: boolean;
        organization_model?: string;
        onboarding_flow?: string;
    }) => Promise<ClientRequest>;
}

/**
 * OpenTelemetry tracing utilities
 */
export interface TracingModule {
    initTracing: () => void;
    shutdownTracing: () => Promise<void>;
    getTracer: () => import('@opentelemetry/api').Tracer;
    withTracing: <T extends (...args: any[]) => any>(
        commandName: string,
        fn: T
    ) => T;
}
