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
exports.respond = void 0;
const async_handler_1 = __importDefault(require("../utils/async-handler"));
const env_1 = __importDefault(require("../env"));
const get_cache_key_1 = require("../utils/get-cache-key");
const cache_1 = __importDefault(require("../cache"));
const json2csv_1 = require("json2csv");
const stream_1 = require("stream");
const ms_1 = __importDefault(require("ms"));
exports.respond = async_handler_1.default((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    if (req.method.toLowerCase() === 'get' &&
        env_1.default.CACHE_ENABLED === true &&
        cache_1.default &&
        !req.sanitizedQuery.export &&
        res.locals.cache !== false) {
        const key = get_cache_key_1.getCacheKey(req);
        yield cache_1.default.set(key, res.locals.payload, ms_1.default(env_1.default.CACHE_TTL));
        yield cache_1.default.set(`${key}__expires_at`, Date.now() + ms_1.default(env_1.default.CACHE_TTL));
        const noCacheRequested = ((_a = req.headers['cache-control']) === null || _a === void 0 ? void 0 : _a.includes('no-cache')) || ((_b = req.headers['Cache-Control']) === null || _b === void 0 ? void 0 : _b.includes('no-cache'));
        // Set cache-control header
        if (env_1.default.CACHE_AUTO_PURGE !== true && noCacheRequested === false) {
            const maxAge = `max-age=${ms_1.default(env_1.default.CACHE_TTL)}`;
            const access = !!((_c = req.accountability) === null || _c === void 0 ? void 0 : _c.role) === false ? 'public' : 'private';
            res.setHeader('Cache-Control', `${access}, ${maxAge}`);
        }
        if (noCacheRequested) {
            res.setHeader('Cache-Control', 'no-cache');
        }
    }
    if (req.sanitizedQuery.export) {
        let filename = '';
        if (req.collection) {
            filename += req.collection;
        }
        else {
            filename += 'Export';
        }
        filename += ' ' + getDateFormatted();
        if (req.sanitizedQuery.export === 'json') {
            res.attachment(`${filename}.json`);
            res.set('Content-Type', 'application/json');
            return res.status(200).send(JSON.stringify(res.locals.payload, null, '\t'));
        }
        if (req.sanitizedQuery.export === 'csv') {
            res.attachment(`${filename}.csv`);
            res.set('Content-Type', 'text/csv');
            const stream = new stream_1.PassThrough();
            if (!((_d = res.locals.payload) === null || _d === void 0 ? void 0 : _d.data) || res.locals.payload.data.length === 0) {
                stream.end(Buffer.from(''));
                return stream.pipe(res);
            }
            else {
                stream.end(Buffer.from(JSON.stringify(res.locals.payload.data), 'utf-8'));
                const json2csv = new json2csv_1.Transform({
                    transforms: [json2csv_1.transforms.flatten({ separator: '.' })],
                });
                return stream.pipe(json2csv).pipe(res);
            }
        }
    }
    if (Buffer.isBuffer(res.locals.payload)) {
        return res.end(res.locals.payload);
    }
    else {
        return res.json(res.locals.payload);
    }
}));
function getDateFormatted() {
    const date = new Date();
    let month = String(date.getMonth() + 1);
    if (month.length === 1)
        month = '0' + month;
    let day = String(date.getDate());
    if (day.length === 1)
        day = '0' + day;
    return `${date.getFullYear()}-${month}-${day} at ${date.getHours()}.${date.getMinutes()}.${date.getSeconds()}`;
}
