import {defineProject} from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineProject({
    plugins: [tsconfigPaths({root: '../..'})],
    test: {
        name: 'gemini',
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        setupFiles: ['tests/setup.ts'],
    },
});
