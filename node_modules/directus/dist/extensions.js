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
exports.registerExtensionHooks = exports.registerExtensionEndpoints = exports.registerExtensions = exports.listExtensions = exports.initializeExtensions = exports.ensureFoldersExist = void 0;
const list_folders_1 = __importDefault(require("./utils/list-folders"));
const path_1 = __importDefault(require("path"));
const env_1 = __importDefault(require("./env"));
const exceptions_1 = require("./exceptions");
const express_1 = __importDefault(require("express"));
const emitter_1 = __importDefault(require("./emitter"));
const logger_1 = __importDefault(require("./logger"));
const fs_extra_1 = require("fs-extra");
const exceptions = __importStar(require("./exceptions"));
const services = __importStar(require("./services"));
const database_1 = __importDefault(require("./database"));
function ensureFoldersExist() {
    return __awaiter(this, void 0, void 0, function* () {
        const folders = ['endpoints', 'hooks', 'interfaces', 'modules', 'layouts', 'displays'];
        for (const folder of folders) {
            const folderPath = path_1.default.resolve(env_1.default.EXTENSIONS_PATH, folder);
            try {
                yield fs_extra_1.ensureDir(folderPath);
            }
            catch (err) {
                logger_1.default.warn(err);
            }
        }
    });
}
exports.ensureFoldersExist = ensureFoldersExist;
function initializeExtensions() {
    return __awaiter(this, void 0, void 0, function* () {
        yield ensureFoldersExist();
    });
}
exports.initializeExtensions = initializeExtensions;
function listExtensions(type) {
    return __awaiter(this, void 0, void 0, function* () {
        const extensionsPath = env_1.default.EXTENSIONS_PATH;
        const location = path_1.default.join(extensionsPath, type);
        try {
            return yield list_folders_1.default(location);
        }
        catch (err) {
            if (err.code === 'ENOENT') {
                throw new exceptions_1.ServiceUnavailableException(`Extension folder "extensions/${type}" couldn't be opened`, {
                    service: 'extensions',
                });
            }
            throw err;
        }
    });
}
exports.listExtensions = listExtensions;
function registerExtensions(router) {
    return __awaiter(this, void 0, void 0, function* () {
        yield registerExtensionHooks();
        yield registerExtensionEndpoints(router);
    });
}
exports.registerExtensions = registerExtensions;
function registerExtensionEndpoints(router) {
    return __awaiter(this, void 0, void 0, function* () {
        let endpoints = [];
        try {
            endpoints = yield listExtensions('endpoints');
            registerEndpoints(endpoints, router);
        }
        catch (err) {
            logger_1.default.warn(err);
        }
    });
}
exports.registerExtensionEndpoints = registerExtensionEndpoints;
function registerExtensionHooks() {
    return __awaiter(this, void 0, void 0, function* () {
        let hooks = [];
        try {
            hooks = yield listExtensions('hooks');
            registerHooks(hooks);
        }
        catch (err) {
            logger_1.default.warn(err);
        }
    });
}
exports.registerExtensionHooks = registerExtensionHooks;
function registerHooks(hooks) {
    const extensionsPath = env_1.default.EXTENSIONS_PATH;
    for (const hook of hooks) {
        try {
            registerHook(hook);
        }
        catch (error) {
            logger_1.default.warn(`Couldn't register hook "${hook}"`);
            logger_1.default.warn(error);
        }
    }
    function registerHook(hook) {
        const hookPath = path_1.default.resolve(extensionsPath, 'hooks', hook, 'index.js');
        const hookInstance = require(hookPath);
        let register = hookInstance;
        if (typeof hookInstance !== 'function') {
            if (hookInstance.default) {
                register = hookInstance.default;
            }
        }
        let events = register({ services, exceptions, env: env_1.default, database: database_1.default });
        for (const [event, handler] of Object.entries(events)) {
            emitter_1.default.on(event, handler);
        }
    }
}
function registerEndpoints(endpoints, router) {
    const extensionsPath = env_1.default.EXTENSIONS_PATH;
    for (const endpoint of endpoints) {
        try {
            registerEndpoint(endpoint);
        }
        catch (error) {
            logger_1.default.warn(`Couldn't register endpoint "${endpoint}"`);
            logger_1.default.warn(error);
        }
    }
    function registerEndpoint(endpoint) {
        const endpointPath = path_1.default.resolve(extensionsPath, 'endpoints', endpoint, 'index.js');
        const endpointInstance = require(endpointPath);
        let register = endpointInstance;
        if (typeof endpointInstance !== 'function') {
            if (endpointInstance.default) {
                register = endpointInstance.default;
            }
        }
        const scopedRouter = express_1.default.Router();
        router.use(`/${endpoint}/`, scopedRouter);
        register(scopedRouter, { services, exceptions, env: env_1.default, database: database_1.default });
    }
}
