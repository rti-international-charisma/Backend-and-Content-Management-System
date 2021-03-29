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
const emitter_1 = __importStar(require("./emitter"));
const env_1 = __importDefault(require("./env"));
const logger_1 = __importDefault(require("./logger"));
// If this file is called directly using node, start the server
if (require.main === module) {
    start();
}
function start() {
    return __awaiter(this, void 0, void 0, function* () {
        const createServer = require('./server').default;
        const server = yield createServer();
        yield emitter_1.default.emitAsync('server.start.before', { server });
        const port = env_1.default.PORT;
        server
            .listen(port, () => {
            logger_1.default.info(`Server started at port ${port}`);
            emitter_1.emitAsyncSafe('server.start');
        })
            .once('error', (err) => {
            if ((err === null || err === void 0 ? void 0 : err.code) === 'EADDRINUSE') {
                logger_1.default.error(`Port ${port} is already in use`);
                process.exit(1);
            }
            else {
                throw err;
            }
        });
    });
}
exports.default = start;
