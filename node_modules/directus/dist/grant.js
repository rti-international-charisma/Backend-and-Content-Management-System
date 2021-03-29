"use strict";
/**
 * Grant is the oAuth library
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = __importDefault(require("./env"));
const to_array_1 = require("./utils/to-array");
const enabledProviders = to_array_1.toArray(env_1.default.OAUTH_PROVIDERS).map((provider) => provider.toLowerCase());
const config = {
    defaults: {
        origin: env_1.default.PUBLIC_URL,
        transport: 'session',
        prefix: '/auth/oauth',
        response: ['tokens', 'profile'],
    },
};
for (const [key, value] of Object.entries(env_1.default)) {
    if (key.startsWith('OAUTH') === false)
        continue;
    const parts = key.split('_');
    const provider = parts[1].toLowerCase();
    if (enabledProviders.includes(provider) === false)
        continue;
    // OAUTH <PROVIDER> SETTING = VALUE
    parts.splice(0, 2);
    const configKey = parts.join('_').toLowerCase();
    config[provider] = Object.assign(Object.assign({}, (config[provider] || {})), { [configKey]: value });
}
exports.default = config;
