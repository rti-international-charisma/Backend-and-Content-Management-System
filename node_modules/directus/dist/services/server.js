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
exports.ServerService = void 0;
const database_1 = __importDefault(require("../database"));
const os_1 = __importDefault(require("os"));
const logger_1 = __importDefault(require("../logger"));
// @ts-ignore
const package_json_1 = require("../../package.json");
const macos_release_1 = __importDefault(require("macos-release"));
const settings_1 = require("./settings");
const mail_1 = require("../mail");
const env_1 = __importDefault(require("../env"));
const perf_hooks_1 = require("perf_hooks");
const cache_1 = __importDefault(require("../cache"));
const rate_limiter_1 = require("../middleware/rate-limiter");
const storage_1 = __importDefault(require("../storage"));
const nanoid_1 = require("nanoid");
const to_array_1 = require("../utils/to-array");
const lodash_1 = require("lodash");
class ServerService {
    constructor(options) {
        this.knex = options.knex || database_1.default;
        this.accountability = options.accountability || null;
        this.schema = options.schema;
        this.settingsService = new settings_1.SettingsService({ knex: this.knex, schema: this.schema });
    }
    serverInfo() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const info = {};
            const projectInfo = yield this.settingsService.readSingleton({
                fields: [
                    'project_name',
                    'project_logo',
                    'project_color',
                    'public_foreground',
                    'public_background',
                    'public_note',
                    'custom_css',
                ],
            });
            info.project = projectInfo;
            if (((_a = this.accountability) === null || _a === void 0 ? void 0 : _a.admin) === true) {
                const osType = os_1.default.type() === 'Darwin' ? 'macOS' : os_1.default.type();
                const osVersion = osType === 'macOS' ? `${macos_release_1.default().name} (${macos_release_1.default().version})` : os_1.default.release();
                info.directus = {
                    version: package_json_1.version,
                };
                info.node = {
                    version: process.versions.node,
                    uptime: Math.round(process.uptime()),
                };
                info.os = {
                    type: osType,
                    version: osVersion,
                    uptime: Math.round(os_1.default.uptime()),
                    totalmem: os_1.default.totalmem(),
                };
            }
            return info;
        });
    }
    health() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const checkID = nanoid_1.nanoid(5);
            const data = {
                status: 'ok',
                releaseId: package_json_1.version,
                serviceId: env_1.default.KEY,
                checks: lodash_1.merge(...(yield Promise.all([testDatabase(), testCache(), testRateLimiter(), testStorage(), testEmail()]))),
            };
            for (const [service, healthData] of Object.entries(data.checks)) {
                for (const healthCheck of healthData) {
                    if (healthCheck.status === 'warn' && data.status === 'ok') {
                        logger_1.default.warn(`${service} in WARN state, the observed value ${healthCheck.observedValue} is above the threshold of ${healthCheck.threshold}${healthCheck.observedUnit}`);
                        data.status = 'warn';
                        continue;
                    }
                    if (healthCheck.status === 'error' && (data.status === 'ok' || data.status === 'warn')) {
                        logger_1.default.error(healthCheck.output, '%s in ERROR state', service);
                        data.status = 'error';
                        break;
                    }
                }
                // No need to continue checking if parent status is already error
                if (data.status === 'error')
                    break;
            }
            if (((_a = this.accountability) === null || _a === void 0 ? void 0 : _a.admin) !== true) {
                return { status: data.status };
            }
            else {
                return data;
            }
            function testDatabase() {
                return __awaiter(this, void 0, void 0, function* () {
                    const client = env_1.default.DB_CLIENT;
                    const checks = {};
                    // Response time
                    // ----------------------------------------------------------------------------------------
                    checks[`${client}:responseTime`] = [
                        {
                            status: 'ok',
                            componentType: 'datastore',
                            observedUnit: 'ms',
                            observedValue: 0,
                            threshold: 150,
                        },
                    ];
                    const startTime = perf_hooks_1.performance.now();
                    try {
                        yield database_1.default.raw('SELECT 1');
                        checks[`${client}:responseTime`][0].status = 'ok';
                    }
                    catch (err) {
                        checks[`${client}:responseTime`][0].status = 'error';
                        checks[`${client}:responseTime`][0].output = err;
                    }
                    finally {
                        const endTime = perf_hooks_1.performance.now();
                        checks[`${client}:responseTime`][0].observedValue = +(endTime - startTime).toFixed(3);
                        if (checks[`${client}:responseTime`][0].observedValue > checks[`${client}:responseTime`][0].threshold &&
                            checks[`${client}:responseTime`][0].status !== 'error') {
                            checks[`${client}:responseTime`][0].status = 'warn';
                        }
                    }
                    checks[`${client}:connectionsAvailable`] = [
                        {
                            status: 'ok',
                            componentType: 'datastore',
                            observedValue: database_1.default.client.pool.numFree(),
                        },
                    ];
                    checks[`${client}:connectionsUsed`] = [
                        {
                            status: 'ok',
                            componentType: 'datastore',
                            observedValue: database_1.default.client.pool.numUsed(),
                        },
                    ];
                    return checks;
                });
            }
            function testCache() {
                return __awaiter(this, void 0, void 0, function* () {
                    if (env_1.default.CACHE_ENABLED !== true) {
                        return {};
                    }
                    const checks = {
                        'cache:responseTime': [
                            {
                                status: 'ok',
                                componentType: 'cache',
                                observedValue: 0,
                                observedUnit: 'ms',
                                threshold: 150,
                            },
                        ],
                    };
                    const startTime = perf_hooks_1.performance.now();
                    try {
                        yield cache_1.default.set(`health-${checkID}`, true, 5);
                        yield cache_1.default.delete(`health-${checkID}`);
                    }
                    catch (err) {
                        checks['cache:responseTime'][0].status = 'error';
                        checks['cache:responseTime'][0].output = err;
                    }
                    finally {
                        const endTime = perf_hooks_1.performance.now();
                        checks['cache:responseTime'][0].observedValue = +(endTime - startTime).toFixed(3);
                        if (checks['cache:responseTime'][0].observedValue > checks['cache:responseTime'][0].threshold &&
                            checks['cache:responseTime'][0].status !== 'error') {
                            checks['cache:responseTime'][0].status = 'warn';
                        }
                    }
                    return checks;
                });
            }
            function testRateLimiter() {
                return __awaiter(this, void 0, void 0, function* () {
                    if (env_1.default.RATE_LIMITER_ENABLED !== true) {
                        return {};
                    }
                    const checks = {
                        'rateLimiter:responseTime': [
                            {
                                status: 'ok',
                                componentType: 'ratelimiter',
                                observedValue: 0,
                                observedUnit: 'ms',
                                threshold: 150,
                            },
                        ],
                    };
                    const startTime = perf_hooks_1.performance.now();
                    try {
                        yield rate_limiter_1.rateLimiter.consume(`health-${checkID}`, 1);
                        yield rate_limiter_1.rateLimiter.delete(`health-${checkID}`);
                    }
                    catch (err) {
                        checks['rateLimiter:responseTime'][0].status = 'error';
                        checks['rateLimiter:responseTime'][0].output = err;
                    }
                    finally {
                        const endTime = perf_hooks_1.performance.now();
                        checks['rateLimiter:responseTime'][0].observedValue = +(endTime - startTime).toFixed(3);
                        if (checks['rateLimiter:responseTime'][0].observedValue > checks['rateLimiter:responseTime'][0].threshold &&
                            checks['rateLimiter:responseTime'][0].status !== 'error') {
                            checks['rateLimiter:responseTime'][0].status = 'warn';
                        }
                    }
                    return checks;
                });
            }
            function testStorage() {
                return __awaiter(this, void 0, void 0, function* () {
                    const checks = {};
                    for (const location of to_array_1.toArray(env_1.default.STORAGE_LOCATIONS)) {
                        const disk = storage_1.default.disk(location);
                        checks[`storage:${location}:responseTime`] = [
                            {
                                status: 'ok',
                                componentType: 'objectstore',
                                observedValue: 0,
                                observedUnit: 'ms',
                                threshold: 750,
                            },
                        ];
                        const startTime = perf_hooks_1.performance.now();
                        try {
                            yield disk.put(`health-${checkID}`, 'check');
                            yield disk.get(`health-${checkID}`);
                            yield disk.delete(`health-${checkID}`);
                        }
                        catch (err) {
                            checks[`storage:${location}:responseTime`][0].status = 'error';
                            checks[`storage:${location}:responseTime`][0].output = err;
                        }
                        finally {
                            const endTime = perf_hooks_1.performance.now();
                            checks[`storage:${location}:responseTime`][0].observedValue = +(endTime - startTime).toFixed(3);
                            if (checks[`storage:${location}:responseTime`][0].observedValue >
                                checks[`storage:${location}:responseTime`][0].threshold &&
                                checks[`storage:${location}:responseTime`][0].status !== 'error') {
                                checks[`storage:${location}:responseTime`][0].status = 'warn';
                            }
                        }
                    }
                    return checks;
                });
            }
            function testEmail() {
                return __awaiter(this, void 0, void 0, function* () {
                    const checks = {
                        'email:connection': [
                            {
                                status: 'ok',
                                componentType: 'email',
                            },
                        ],
                    };
                    try {
                        yield (mail_1.transporter === null || mail_1.transporter === void 0 ? void 0 : mail_1.transporter.verify());
                    }
                    catch (err) {
                        checks['email:connection'][0].status = 'error';
                        checks['email:connection'][0].output = err;
                    }
                    return checks;
                });
            }
        });
    }
}
exports.ServerService = ServerService;
