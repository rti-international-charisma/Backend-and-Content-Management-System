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
const uuid_1 = require("uuid");
const nanoid_1 = require("nanoid");
const liquidjs_1 = require("liquidjs");
const fs_1 = __importDefault(require("fs"));
const util_1 = require("util");
const path_1 = __importDefault(require("path"));
const readFile = util_1.promisify(fs_1.default.readFile);
const writeFile = util_1.promisify(fs_1.default.writeFile);
const fchmod = util_1.promisify(fs_1.default.fchmod);
const open = util_1.promisify(fs_1.default.open);
const liquidEngine = new liquidjs_1.Liquid({
    extname: '.liquid',
});
const defaults = {
    security: {
        KEY: uuid_1.v4(),
        SECRET: nanoid_1.nanoid(32),
    },
};
function createEnv(client, credentials, directory) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = Object.assign(Object.assign({}, defaults), { database: {
                DB_CLIENT: client,
            } });
        for (const [key, value] of Object.entries(credentials)) {
            config.database[`DB_${key.toUpperCase()}`] = value;
        }
        const configAsStrings = {};
        for (const [key, value] of Object.entries(config)) {
            configAsStrings[key] = '';
            for (const [envKey, envValue] of Object.entries(value)) {
                configAsStrings[key] += `${envKey}="${envValue}"\n`;
            }
        }
        const templateString = yield readFile(path_1.default.join(__dirname, 'env-stub.liquid'), 'utf8');
        const text = yield liquidEngine.parseAndRender(templateString, configAsStrings);
        yield writeFile(path_1.default.join(directory, '.env'), text);
        yield fchmod(yield open(path_1.default.join(directory, '.env'), 'r+'), 0o640);
    });
}
exports.default = createEnv;
