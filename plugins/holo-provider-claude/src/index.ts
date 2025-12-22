/**
 * Claude Provider Plugin
 *
 * Entry point for the Claude provider plugin.
 * Exports the plugin instance as default export per Holo plugin contract.
 */

import {ClaudeProviderPlugin} from './plugin.js';

// Export the plugin class for testing/extension
export {ClaudeProviderPlugin};

// Export singleton instance as default for plugin loading
export default new ClaudeProviderPlugin();
