import {defineConfig} from 'vitest/config';

export default defineConfig({
    test: {
        projects: [
            'plugins/sdk',
            'plugins/sdk/vitest.integration.config.ts',
            'plugins/holo-provider-openai',
            'plugins/holo-provider-claude',
            'plugins/holo-provider-gemini',
            'plugins/holo-provider-ollama',
            'app',
        ],
    },
});
