"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isInstalled = exports.schemaInspector = exports.validateDBConnection = exports.hasDatabaseConnection = void 0;
const knex_1 = require("knex");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const logger_1 = __importDefault(require("../logger"));
const env_1 = __importDefault(require("../env"));
const validate_env_1 = require("../utils/validate-env");
const perf_hooks_1 = require("perf_hooks");
const schema_1 = __importDefault(require("@directus/schema"));
const get_config_from_env_1 = require("../utils/get-config-from-env");
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../', '.env') });
const connectionConfig = get_config_from_env_1.getConfigFromEnv('DB_', [
    'DB_CLIENT',
    'DB_SEARCH_PATH',
    'DB_CONNECTION_STRING',
    'DB_POOL',
]);
const poolConfig = get_config_from_env_1.getConfigFromEnv('DB_POOL');
validate_env_1.validateEnv(['DB_CLIENT']);
const knexConfig = {
    client: env_1.default.DB_CLIENT,
    searchPath: env_1.default.DB_SEARCH_PATH,
    connection: env_1.default.DB_CONNECTION_STRING || connectionConfig,
    log: {
        warn: (msg) => logger_1.default.warn(msg),
        error: (msg) => logger_1.default.error(msg),
        deprecate: (msg) => logger_1.default.info(msg),
        debug: (msg) => logger_1.default.debug(msg),
    },
    pool: poolConfig,
};
if (env_1.default.DB_CLIENT === 'sqlite3') {
    knexConfig.useNullAsDefault = true;
    poolConfig.afterCreate = (conn, cb) => {
        conn.run('PRAGMA foreign_keys = ON', cb);
    };
}
const database = knex_1.knex(knexConfig);
const times = {};
database
    .on('query', (queryInfo) => {
    times[queryInfo.__knexUid] = perf_hooks_1.performance.now();
})
    .on('query-response', (response, queryInfo) => {
    const delta = perf_hooks_1.performance.now() - times[queryInfo.__knexUid];
    logger_1.default.trace(`[${delta.toFixed(3)}ms] ${queryInfo.sql} [${queryInfo.bindings.join(', ')}]`);
});
function hasDatabaseConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (env_1.default.DB_CLIENT === 'oracledb') {
                yield database.raw('select 1 from DUAL');
            }
            else {
                yield database.raw('SELECT 1');
            }
            return true;
        }
        catch (_a) {
            return false;
        }
    });
}
exports.hasDatabaseConnection = hasDatabaseConnection;
function validateDBConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield hasDatabaseConnection();
        }
        catch (error) {
            logger_1.default.error(`Can't connect to the database.`);
            logger_1.default.error(error);
            process.exit(1);
        }
    });
}
exports.validateDBConnection = validateDBConnection;
exports.schemaInspector = schema_1.default(database);
function isInstalled() {
    return __awaiter(this, void 0, void 0, function* () {
        // The existence of a directus_collections table alone isn't a "proper" check to see if everything
        // is installed correctly of course, but it's safe enough to assume that this collection only
        // exists when using the installer CLI.
        return yield exports.schemaInspector.hasTable('directus_collections');
    });
}
exports.isInstalled = isInstalled;
exports.default = database;
