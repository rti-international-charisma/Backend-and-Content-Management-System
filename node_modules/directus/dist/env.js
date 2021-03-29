"use strict";
/**
 * @NOTE
 * See example.env for all possible keys
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const require_yaml_1 = require("./utils/require-yaml");
const dotenv_1 = __importDefault(require("dotenv"));
const lodash_1 = require("lodash");
const to_array_1 = require("./utils/to-array");
const logger_1 = __importDefault(require("./logger"));
const acceptableEnvTypes = ['string', 'number', 'regex', 'array'];
const defaults = {
    CONFIG_PATH: path_1.default.resolve(process.cwd(), '.env'),
    PORT: 8055,
    PUBLIC_URL: 'http://localhost:8055',
    MAX_PAYLOAD_SIZE: '100kb',
    STORAGE_LOCATIONS: 'local',
    STORAGE_LOCAL_DRIVER: 'local',
    STORAGE_LOCAL_ROOT: './uploads',
    RATE_LIMITER_ENABLED: false,
    RATE_LIMITER_POINTS: 25,
    RATE_LIMITER_DURATION: 1,
    RATE_LIMITER_STORE: 'memory',
    ACCESS_TOKEN_TTL: '15m',
    REFRESH_TOKEN_TTL: '7d',
    REFRESH_TOKEN_COOKIE_SECURE: false,
    REFRESH_TOKEN_COOKIE_SAME_SITE: 'lax',
    CORS_ENABLED: true,
    CORS_ORIGIN: true,
    CORS_METHODS: 'GET,POST,PATCH,DELETE',
    CORS_ALLOWED_HEADERS: 'Content-Type,Authorization',
    CORS_EXPOSED_HEADERS: 'Content-Range',
    CORS_CREDENTIALS: true,
    CORS_MAX_AGE: 18000,
    CACHE_ENABLED: false,
    CACHE_STORE: 'memory',
    CACHE_TTL: '30m',
    CACHE_NAMESPACE: 'system-cache',
    CACHE_AUTO_PURGE: false,
    ASSETS_CACHE_TTL: '30m',
    OAUTH_PROVIDERS: '',
    EXTENSIONS_PATH: './extensions',
    EMAIL_FROM: 'no-reply@directus.io',
    EMAIL_TRANSPORT: 'sendmail',
    EMAIL_SENDMAIL_NEW_LINE: 'unix',
    EMAIL_SENDMAIL_PATH: '/usr/sbin/sendmail',
    TELEMETRY: true,
};
// Allows us to force certain environment variable into a type, instead of relying
// on the auto-parsed type in processValues. ref #3705
const typeMap = {
    PORT: 'number',
    DB_NAME: 'string',
    DB_USER: 'string',
    DB_PASSWORD: 'string',
    DB_DATABASE: 'string',
    DB_PORT: 'number',
};
let env = Object.assign(Object.assign(Object.assign({}, defaults), getEnv()), process.env);
process.env = env;
env = processValues(env);
exports.default = env;
function getEnv() {
    const configPath = path_1.default.resolve(process.env.CONFIG_PATH || defaults.CONFIG_PATH);
    if (fs_1.default.existsSync(configPath) === false)
        return {};
    const fileExt = path_1.default.extname(configPath).toLowerCase();
    if (fileExt === '.js') {
        const module = require(configPath);
        const exported = module.default || module;
        if (typeof exported === 'function') {
            return exported(process.env);
        }
        else if (typeof exported === 'object') {
            return exported;
        }
        logger_1.default.warn(`Invalid JS configuration file export type. Requires one of "function", "object", received: "${typeof exported}"`);
    }
    if (fileExt === '.json') {
        return require(configPath);
    }
    if (fileExt === '.yaml' || fileExt === '.yml') {
        const data = require_yaml_1.requireYAML(configPath);
        if (typeof data === 'object') {
            return data;
        }
        logger_1.default.warn('Invalid YAML configuration. Root has to ben an object.');
    }
    // Default to env vars plain text files
    return dotenv_1.default.parse(fs_1.default.readFileSync(configPath).toString());
}
function getVariableType(variable) {
    return variable.split(':').slice(0, -1)[0];
}
function getEnvVariableValue(variableValue, variableType) {
    return variableValue.split(`${variableType}:`)[1];
}
function getEnvironmentValueByType(envVariableString) {
    const variableType = getVariableType(envVariableString);
    const envVariableValue = getEnvVariableValue(envVariableString, variableType);
    switch (variableType) {
        case 'number':
            return lodash_1.toNumber(envVariableValue);
        case 'array':
            return to_array_1.toArray(envVariableValue);
        case 'regex':
            return new RegExp(envVariableValue);
        case 'string':
            return envVariableValue;
    }
}
function processValues(env) {
    env = lodash_1.clone(env);
    for (const [key, value] of Object.entries(env)) {
        if (typeof value === 'string' && acceptableEnvTypes.some((envType) => value.includes(`${envType}:`))) {
            env[key] = getEnvironmentValueByType(value);
            continue;
        }
        if (typeMap[key]) {
            switch (typeMap[key]) {
                case 'number':
                    env[key] = lodash_1.toNumber(value);
                    break;
                case 'string':
                    env[key] = lodash_1.toString(value);
                    break;
                case 'array':
                    env[key] = to_array_1.toArray(value);
                    break;
            }
            continue;
        }
        if (value === 'true')
            env[key] = true;
        if (value === 'false')
            env[key] = false;
        if (value === 'null')
            env[key] = null;
        if (String(value).startsWith('0') === false && isNaN(value) === false && value.length > 0)
            env[key] = Number(value);
    }
    return env;
}
