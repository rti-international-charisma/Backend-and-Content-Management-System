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
exports.track = void 0;
const axios_1 = __importDefault(require("axios"));
const os_1 = __importDefault(require("os"));
const node_machine_id_1 = require("node-machine-id");
const ms_1 = __importDefault(require("ms"));
const logger_1 = __importDefault(require("../logger"));
const env_1 = __importDefault(require("../env"));
// @ts-ignore
const package_json_1 = require("../../package.json");
function track(event) {
    return __awaiter(this, void 0, void 0, function* () {
        if (env_1.default.TELEMETRY !== false) {
            const info = yield getEnvInfo(event);
            try {
                yield axios_1.default.post('https://telemetry.directus.io/', info);
            }
            catch (err) {
                if ('DIRECTUS_DEV' in process.env) {
                    logger_1.default.error(err);
                }
            }
        }
    });
}
exports.track = track;
function getEnvInfo(event) {
    return __awaiter(this, void 0, void 0, function* () {
        return {
            version: package_json_1.version,
            event: event,
            project_id: env_1.default.KEY,
            machine_id: yield node_machine_id_1.machineId(),
            environment: process.env.NODE_ENV,
            stack: 'node',
            os: {
                arch: os_1.default.arch(),
                platform: os_1.default.platform(),
                release: os_1.default.release(),
            },
            rate_limiter: {
                enabled: env_1.default.RATE_LIMITER_ENABLED,
                points: +env_1.default.RATE_LIMITER_POINTS,
                duration: +env_1.default.RATE_LIMITER_DURATION,
                store: env_1.default.RATE_LIMITER_STORE,
            },
            cache: {
                enabled: env_1.default.CACHE_ENABLED,
                ttl: ms_1.default(env_1.default.CACHE_TTL),
                store: env_1.default.CACHE_STORE,
            },
            storage: {
                drivers: getStorageDrivers(),
            },
            cors: {
                enabled: env_1.default.CORS_ENABLED,
            },
            email: {
                transport: env_1.default.EMAIL_TRANSPORT,
            },
            oauth: {
                providers: env_1.default.OAUTH_PROVIDERS.split(',')
                    .map((v) => v.trim())
                    .filter((v) => v),
            },
            db_client: env_1.default.DB_CLIENT,
        };
    });
}
function getStorageDrivers() {
    const drivers = [];
    const locations = env_1.default.STORAGE_LOCATIONS.split(',')
        .map((v) => v.trim())
        .filter((v) => v);
    for (const location of locations) {
        const driver = env_1.default[`STORAGE_${location.toUpperCase()}_DRIVER`];
        drivers.push(driver);
    }
    return drivers;
}
