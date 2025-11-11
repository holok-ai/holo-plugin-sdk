/**
 * Integration Test Configuration
 *
 * Loads and validates environment variables for integration tests.
 * NO MOCKING - all tests make real HTTP requests.
 */

export interface IntegrationTestConfig {
    baseUrl: string;
    authToken: string;
    timeout: number;
}

/**
 * Load configuration from environment variables
 * @throws Error if required variables are missing
 */
export function loadTestConfig(): IntegrationTestConfig {
    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
    const authToken = process.env.TEST_AUTH_TOKEN;

    if (!authToken) {
        throw new Error(
            'TEST_AUTH_TOKEN environment variable is required for integration tests.\n' +
            'Set it in your environment: export TEST_AUTH_TOKEN=your-test-token'
        );
    }

    const timeout = parseInt(process.env.TEST_TIMEOUT || '30000', 10);

    return {
        baseUrl,
        authToken,
        timeout
    };
}

/**
 * Validate configuration
 */
export function validateConfig(config: IntegrationTestConfig): void {
    if (!config.baseUrl.startsWith('http')) {
        throw new Error(`Invalid TEST_BASE_URL: ${config.baseUrl}. Must start with http:// or https://`);
    }

    if (!config.authToken || config.authToken.length === 0) {
        throw new Error('TEST_AUTH_TOKEN cannot be empty');
    }

    if (config.timeout < 1000) {
        throw new Error('TEST_TIMEOUT must be at least 1000ms');
    }
}
