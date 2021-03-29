"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = __importDefault(require("./env"));
const keyv_1 = __importDefault(require("keyv"));
const validate_env_1 = require("./utils/validate-env");
const get_config_from_env_1 = require("./utils/get-config-from-env");
const ms_1 = __importDefault(require("ms"));
const logger_1 = __importDefault(require("./logger"));
let cache = null;
if (env_1.default.CACHE_ENABLED === true) {
    validate_env_1.validateEnv(['CACHE_NAMESPACE', 'CACHE_TTL', 'CACHE_STORE']);
    cache = getKeyvInstance();
    cache.on('error', (err) => logger_1.default.error(err));
}
exports.default = cache;
function getKeyvInstance() {
    switch (env_1.default.CACHE_STORE) {
        case 'redis':
            return new keyv_1.default(getConfig('redis'));
        case 'memcache':
            return new keyv_1.default(getConfig('memcache'));
        case 'memory':
        default:
            return new keyv_1.default(getConfig());
    }
}
function getConfig(store = 'memory') {
    const config = {
        namespace: env_1.default.CACHE_NAMESPACE,
        ttl: ms_1.default(env_1.default.CACHE_TTL),
    };
    if (store === 'redis') {
        const KeyvRedis = require('@keyv/redis');
        config.store = new KeyvRedis(env_1.default.CACHE_REDIS || get_config_from_env_1.getConfigFromEnv('CACHE_REDIS_'));
    }
    if (store === 'memcache') {
        const KeyvMemcache = require('keyv-memcache');
        config.store = new KeyvMemcache(env_1.default.CACHE_MEMCACHE);
    }
    return config;
}
