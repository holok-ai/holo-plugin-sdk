import 'reflect-metadata';
import {resolve} from 'node:path';
import {existsSync} from 'node:fs';

const rootEnv = resolve(import.meta.dirname, '../../../../.env');
if (existsSync(rootEnv)) {
    process.loadEnvFile(rootEnv);
}

if (!process.env['HOLO_URL']) {
    throw new Error(
        'HOLO_URL is not set. SDK integration tests require a live gateway.\n' +
        'Set HOLO_URL in the root .env file or pass it directly:\n' +
        '  HOLO_URL=http://localhost:3000 HOLO_TEST_TOKEN=my-token npm run test:integration',
    );
}

if (!process.env['HOLO_TEST_TOKEN']) {
    throw new Error(
        'HOLO_TEST_TOKEN is not set. SDK integration tests require an auth token.\n' +
        'Set HOLO_TEST_TOKEN in the root .env file or pass it directly:\n' +
        '  HOLO_URL=http://localhost:3000 HOLO_TEST_TOKEN=my-token npm run test:integration',
    );
}
