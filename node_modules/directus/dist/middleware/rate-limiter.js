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
exports.rateLimiter = void 0;
const async_handler_1 = __importDefault(require("../utils/async-handler"));
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const env_1 = __importDefault(require("../env"));
const get_config_from_env_1 = require("../utils/get-config-from-env");
const exceptions_1 = require("../exceptions");
const ms_1 = __importDefault(require("ms"));
const validate_env_1 = require("../utils/validate-env");
let checkRateLimit = (req, res, next) => next();
if (env_1.default.RATE_LIMITER_ENABLED === true) {
    validate_env_1.validateEnv(['RATE_LIMITER_STORE', 'RATE_LIMITER_DURATION', 'RATE_LIMITER_POINTS']);
    exports.rateLimiter = getRateLimiter();
    checkRateLimit = async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield exports.rateLimiter.consume(req.ip, 1);
        }
        catch (rateLimiterRes) {
            if (rateLimiterRes instanceof Error)
                throw rateLimiterRes;
            res.set('Retry-After', String(rateLimiterRes.msBeforeNext / 1000));
            throw new exceptions_1.HitRateLimitException(`Too many requests, retry after ${ms_1.default(rateLimiterRes.msBeforeNext)}.`, {
                limit: +env_1.default.RATE_LIMITER_POINTS,
                reset: new Date(Date.now() + rateLimiterRes.msBeforeNext),
            });
        }
        next();
    }));
}
exports.default = checkRateLimit;
function getRateLimiter() {
    switch (env_1.default.RATE_LIMITER_STORE) {
        case 'redis':
            return new rate_limiter_flexible_1.RateLimiterRedis(getConfig('redis'));
        case 'memcache':
            return new rate_limiter_flexible_1.RateLimiterMemcache(getConfig('memcache'));
        case 'memory':
        default:
            return new rate_limiter_flexible_1.RateLimiterMemory(getConfig());
    }
}
function getConfig(store = 'memory') {
    const config = get_config_from_env_1.getConfigFromEnv('RATE_LIMITER_', `RATE_LIMITER_${store}_`);
    if (store === 'redis') {
        const Redis = require('ioredis');
        delete config.redis;
        config.storeClient = new Redis(env_1.default.RATE_LIMITER_REDIS || get_config_from_env_1.getConfigFromEnv('RATE_LIMITER_REDIS_'));
    }
    if (store === 'memcache') {
        const Memcached = require('memcached');
        config.storeClient = new Memcached(env_1.default.RATE_LIMITER_MEMCACHE, get_config_from_env_1.getConfigFromEnv('RATE_LIMITER_MEMCACHE_'));
    }
    delete config.enabled;
    delete config.store;
    return config;
}
