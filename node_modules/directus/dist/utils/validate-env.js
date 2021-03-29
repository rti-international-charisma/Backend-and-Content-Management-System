"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnv = void 0;
const logger_1 = __importDefault(require("../logger"));
const env_1 = __importDefault(require("../env"));
function validateEnv(requiredKeys) {
    if (env_1.default.DB_CLIENT && env_1.default.DB_CLIENT === 'sqlite3') {
        requiredKeys.push('DB_FILENAME');
    }
    else if (env_1.default.DB_CLIENT && env_1.default.DB_CLIENT === 'oracledb') {
        requiredKeys.push('DB_USER', 'DB_PASSWORD', 'DB_CONNECT_STRING');
    }
    else {
        if (env_1.default.DB_CLIENT === 'pg') {
            if (!env_1.default.DB_CONNECTION_STRING) {
                requiredKeys.push('DB_HOST', 'DB_PORT', 'DB_DATABASE', 'DB_USER');
            }
        }
        else {
            requiredKeys.push('DB_HOST', 'DB_PORT', 'DB_DATABASE', 'DB_USER', 'DB_PASSWORD');
        }
    }
    for (const requiredKey of requiredKeys) {
        if (env_1.default.hasOwnProperty(requiredKey) === false) {
            logger_1.default.error(`"${requiredKey}" Environment Variable is missing.`);
            process.exit(1);
        }
    }
}
exports.validateEnv = validateEnv;
