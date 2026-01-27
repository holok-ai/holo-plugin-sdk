/**
 * OpenAI Provider Plugin
 *
 * Entry point for the OpenAI provider plugin.
 * Exports the plugin instance as default export per Holo plugin contract.
 */

import {OpenAIProviderPlugin} from './plugin.js';

export * from './services';
export * from './translators';
export * from './manifest';

export * from './openai.auditor';
export * from './openai.translator';
export * from './plugin';

// Export singleton instance as default for plugin loading
export default new OpenAIProviderPlugin();