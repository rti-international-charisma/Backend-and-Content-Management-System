"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfigFromEnv = void 0;
const camelcase_1 = __importDefault(require("camelcase"));
const env_1 = __importDefault(require("../env"));
const lodash_1 = require("lodash");
function getConfigFromEnv(prefix, omitPrefix) {
    const config = {};
    for (const [key, value] of Object.entries(env_1.default)) {
        if (key.toLowerCase().startsWith(prefix.toLowerCase()) === false)
            continue;
        if (omitPrefix) {
            let matches = false;
            if (Array.isArray(omitPrefix)) {
                matches = omitPrefix.some((prefix) => key.toLowerCase().startsWith(prefix.toLowerCase()));
            }
            else {
                matches = key.toLowerCase().startsWith(omitPrefix.toLowerCase());
            }
            if (matches)
                continue;
        }
        if (key.includes('__')) {
            const path = key
                .split('__')
                .map((key, index) => (index === 0 ? camelcase_1.default(camelcase_1.default(key.slice(prefix.length))) : camelcase_1.default(key)));
            lodash_1.set(config, path.join('.'), value);
        }
        else {
            config[camelcase_1.default(key.slice(prefix.length))] = value;
        }
    }
    return config;
}
exports.getConfigFromEnv = getConfigFromEnv;
