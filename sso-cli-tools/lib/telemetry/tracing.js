/**
 * @fileoverview OpenTelemetry Tracing Configuration
 * @description Initialize tracing for CLI commands
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { trace, SpanStatusCode } from '@opentelemetry/api';

// Environment-based configuration
const OTEL_ENABLED = process.env.OTEL_ENABLED === 'true';
const OTEL_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces';

let sdk = null;

/**
 * Initialize OpenTelemetry SDK
 * Only initializes if OTEL_ENABLED=true environment variable is set
 */
export function initTracing() {
    if (!OTEL_ENABLED) {
        return;
    }

    const exporter = new OTLPTraceExporter({
        url: OTEL_ENDPOINT,
    });

    sdk = new NodeSDK({
        resource: new Resource({
            [ATTR_SERVICE_NAME]: 'sso-cli-tools',
            [ATTR_SERVICE_VERSION]: '1.0.0',
        }),
        traceExporter: exporter,
    });

    sdk.start();
    console.log('🔭 OpenTelemetry tracing initialized');

    // Graceful shutdown
    process.on('SIGTERM', () => {
        sdk.shutdown()
            .then(() => console.log('Tracing terminated'))
            .catch((error) => console.error('Error terminating tracing', error))
            .finally(() => process.exit(0));
    });
}

/**
 * Shutdown OpenTelemetry SDK
 */
export async function shutdownTracing() {
    if (sdk) {
        await sdk.shutdown();
    }
}

/**
 * Get tracer for creating spans
 * @returns {import('@opentelemetry/api').Tracer}
 */
export function getTracer() {
    return trace.getTracer('sso-cli-tools', '1.0.0');
}

/**
 * Wrap a command function with tracing
 * @param {string} commandName - Name of the command
 * @param {Function} fn - Command function to wrap
 * @returns {Function} Wrapped function with tracing
 */
export function withTracing(commandName, fn) {
    return async (...args) => {
        if (!OTEL_ENABLED) {
            return fn(...args);
        }

        const tracer = getTracer();
        return tracer.startActiveSpan(`cli.${commandName}`, async (span) => {
            try {
                span.setAttribute('cli.command', commandName);
                span.setAttribute('cli.args', JSON.stringify(args));

                const result = await fn(...args);

                span.setStatus({ code: SpanStatusCode.OK });
                return result;
            } catch (error) {
                span.setStatus({
                    code: SpanStatusCode.ERROR,
                    message: error.message,
                });
                span.recordException(error);
                throw error;
            } finally {
                span.end();
            }
        });
    };
}

export default {
    initTracing,
    shutdownTracing,
    getTracer,
    withTracing,
};
