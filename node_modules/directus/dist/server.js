"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const http = __importStar(require("http"));
const https = __importStar(require("https"));
const qs_1 = __importDefault(require("qs"));
const url_1 = require("url");
const terminus_1 = require("@godaddy/terminus");
const logger_1 = __importDefault(require("./logger"));
const emitter_1 = require("./emitter");
const database_1 = __importDefault(require("./database"));
const app_1 = __importDefault(require("./app"));
const lodash_1 = require("lodash");
function createServer() {
    return __awaiter(this, void 0, void 0, function* () {
        const server = http.createServer(yield app_1.default());
        server.on('request', function (req, res) {
            const startTime = process.hrtime();
            const complete = lodash_1.once(function (finished) {
                var _a, _b, _c, _d;
                const elapsedTime = process.hrtime(startTime);
                const elapsedNanoseconds = elapsedTime[0] * 1e9 + elapsedTime[1];
                const elapsedMilliseconds = elapsedNanoseconds / 1e6;
                const previousIn = ((_a = req.connection._metrics) === null || _a === void 0 ? void 0 : _a.in) || 0;
                const previousOut = ((_b = req.connection._metrics) === null || _b === void 0 ? void 0 : _b.out) || 0;
                const metrics = {
                    in: req.connection.bytesRead - previousIn,
                    out: req.connection.bytesWritten - previousOut,
                };
                req.connection._metrics = {
                    in: req.connection.bytesRead,
                    out: req.connection.bytesWritten,
                };
                // Compatibility when supporting serving with certificates
                const protocol = server instanceof https.Server ? 'https' : 'http';
                const url = new url_1.URL((req.originalUrl || req.url), `${protocol}://${req.headers.host}`);
                const query = url.search.startsWith('?') ? url.search.substr(1) : url.search;
                const info = {
                    finished,
                    request: {
                        aborted: req.aborted,
                        completed: req.complete,
                        method: req.method,
                        url: url.href,
                        path: url.pathname,
                        protocol,
                        host: req.headers.host,
                        size: metrics.in,
                        query: qs_1.default.parse(query),
                        headers: req.headers,
                    },
                    response: {
                        status: res.statusCode,
                        size: metrics.out,
                        headers: res.getHeaders(),
                    },
                    ip: req.headers['x-forwarded-for'] || ((_c = req.connection) === null || _c === void 0 ? void 0 : _c.remoteAddress) || ((_d = req.socket) === null || _d === void 0 ? void 0 : _d.remoteAddress),
                    duration: elapsedMilliseconds.toFixed(),
                };
                emitter_1.emitAsyncSafe('response', info);
            });
            res.once('finish', complete.bind(null, true));
            res.once('close', complete.bind(null, false));
        });
        const terminusOptions = {
            timeout: 1000,
            signals: ['SIGINT', 'SIGTERM', 'SIGHUP'],
            beforeShutdown,
            onSignal,
            onShutdown,
        };
        terminus_1.createTerminus(server, terminusOptions);
        return server;
        function beforeShutdown() {
            return __awaiter(this, void 0, void 0, function* () {
                emitter_1.emitAsyncSafe('server.stop.before', { server });
                if ('DIRECTUS_DEV' in process.env) {
                    logger_1.default.info('Restarting...');
                }
                else {
                    logger_1.default.info('Shutting down...');
                }
            });
        }
        function onSignal() {
            return __awaiter(this, void 0, void 0, function* () {
                yield database_1.default.destroy();
                logger_1.default.info('Database connections destroyed');
            });
        }
        function onShutdown() {
            return __awaiter(this, void 0, void 0, function* () {
                emitter_1.emitAsyncSafe('server.stop');
                if (!('DIRECTUS_DEV' in process.env)) {
                    logger_1.default.info('Directus shut down OK. Bye bye!');
                }
            });
        }
    });
}
exports.default = createServer;
