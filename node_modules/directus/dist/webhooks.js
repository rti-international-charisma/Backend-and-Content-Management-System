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
exports.unregister = exports.register = void 0;
const emitter_1 = __importDefault(require("./emitter"));
const database_1 = __importDefault(require("./database"));
const axios_1 = __importDefault(require("axios"));
const logger_1 = __importDefault(require("./logger"));
let registered = [];
function register() {
    return __awaiter(this, void 0, void 0, function* () {
        unregister();
        const webhooks = yield database_1.default.select('*').from('directus_webhooks').where({ status: 'active' });
        for (const webhook of webhooks) {
            if (webhook.actions === '*') {
                const event = 'items.*';
                const handler = createHandler(webhook);
                emitter_1.default.on(event, handler);
                registered.push({ event, handler });
            }
            else {
                for (const action of webhook.actions.split(',')) {
                    const event = `items.${action}`;
                    const handler = createHandler(webhook);
                    emitter_1.default.on(event, handler);
                    registered.push({ event, handler });
                }
            }
        }
    });
}
exports.register = register;
function unregister() {
    for (const { event, handler } of registered) {
        emitter_1.default.off(event, handler);
    }
    registered = [];
}
exports.unregister = unregister;
function createHandler(webhook) {
    return (data) => __awaiter(this, void 0, void 0, function* () {
        const collectionAllowList = webhook.collections.split(',');
        if (collectionAllowList.includes('*') === false && collectionAllowList.includes(data.collection) === false)
            return;
        try {
            yield axios_1.default({
                url: webhook.url,
                method: webhook.method,
                data: webhook.data ? data : null,
            });
        }
        catch (error) {
            logger_1.default.warn(`Webhook "${webhook.name}" (id: ${webhook.id}) failed`);
            logger_1.default.warn(error);
        }
    });
}
