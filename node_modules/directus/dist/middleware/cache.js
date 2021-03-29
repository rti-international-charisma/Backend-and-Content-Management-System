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
const async_handler_1 = __importDefault(require("../utils/async-handler"));
const env_1 = __importDefault(require("../env"));
const get_cache_key_1 = require("../utils/get-cache-key");
const cache_1 = __importDefault(require("../cache"));
const checkCacheMiddleware = async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    if (req.method.toLowerCase() !== 'get')
        return next();
    if (env_1.default.CACHE_ENABLED !== true)
        return next();
    if (!cache_1.default)
        return next();
    if (((_a = req.headers['cache-control']) === null || _a === void 0 ? void 0 : _a.includes('no-cache')) || ((_b = req.headers['Cache-Control']) === null || _b === void 0 ? void 0 : _b.includes('no-cache'))) {
        return next();
    }
    const key = get_cache_key_1.getCacheKey(req);
    const cachedData = yield cache_1.default.get(key);
    if (cachedData) {
        // Set cache-control header
        if (env_1.default.CACHE_AUTO_PURGE !== true) {
            const expiresAt = yield cache_1.default.get(`${key}__expires_at`);
            const maxAge = `max-age=${expiresAt - Date.now()}`;
            const access = !!((_c = req.accountability) === null || _c === void 0 ? void 0 : _c.role) === false ? 'public' : 'private';
            res.setHeader('Cache-Control', `${access}, ${maxAge}`);
        }
        return res.json(cachedData);
    }
    else {
        return next();
    }
}));
exports.default = checkCacheMiddleware;
