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
exports.RevisionsService = void 0;
const items_1 = require("./items");
const exceptions_1 = require("../exceptions");
/**
 * @TODO only return data / delta based on permissions you have for the requested collection
 */
class RevisionsService extends items_1.ItemsService {
    constructor(options) {
        super('directus_revisions', options);
    }
    revert(pk) {
        const _super = Object.create(null, {
            readByKey: { get: () => super.readByKey }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const revision = (yield _super.readByKey.call(this, pk));
            if (!revision)
                throw new exceptions_1.ForbiddenException();
            if (!revision.data)
                throw new exceptions_1.InvalidPayloadException(`Revision doesn't contain data to revert to`);
            const service = new items_1.ItemsService(revision.collection, {
                accountability: this.accountability,
                knex: this.knex,
                schema: this.schema,
            });
            yield service.update(revision.data, revision.item);
        });
    }
}
exports.RevisionsService = RevisionsService;
