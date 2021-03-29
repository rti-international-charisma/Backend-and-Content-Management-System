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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksService = void 0;
const items_1 = require("./items");
const webhooks_1 = require("../webhooks");
class WebhooksService extends items_1.ItemsService {
    constructor(options) {
        super('directus_webhooks', options);
    }
    create(data) {
        const _super = Object.create(null, {
            create: { get: () => super.create }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield _super.create.call(this, data);
            yield webhooks_1.register();
            return result;
        });
    }
    update(data, key) {
        const _super = Object.create(null, {
            update: { get: () => super.update }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield _super.update.call(this, data, key);
            yield webhooks_1.register();
            return result;
        });
    }
    delete(key) {
        const _super = Object.create(null, {
            delete: { get: () => super.delete }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield _super.delete.call(this, key);
            yield webhooks_1.register();
            return result;
        });
    }
}
exports.WebhooksService = WebhooksService;
