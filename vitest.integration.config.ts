import {defineProject} from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineProject({
    plugins: [tsconfigPaths({root: '../..'})],
    test: {
        name: 'sdk-live',
        environment: 'node',
        include: ['tests/integration/**/*.test.ts'],
        setupFiles: ['tests/integration/setup.ts'],
        globalSetup: ['../../app/tests/integration/global-setup.ts'],
        testTimeout: 30000,
    },
});
