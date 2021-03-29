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
exports.UtilsService = void 0;
const database_1 = __importDefault(require("../database"));
const exceptions_1 = require("../exceptions");
const collections_1 = require("../database/system-data/collections");
class UtilsService {
    constructor(options) {
        this.knex = options.knex || database_1.default;
        this.accountability = options.accountability || null;
        this.schema = options.schema;
    }
    sort(collection, { item, to }) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const sortFieldResponse = (yield this.knex.select('sort_field').from('directus_collections').where({ collection }).first()) ||
                collections_1.systemCollectionRows;
            const sortField = sortFieldResponse === null || sortFieldResponse === void 0 ? void 0 : sortFieldResponse.sort_field;
            if (!sortField) {
                throw new exceptions_1.InvalidPayloadException(`Collection "${collection}" doesn't have a sort field.`);
            }
            if (((_a = this.accountability) === null || _a === void 0 ? void 0 : _a.admin) !== true) {
                const permissions = this.schema.permissions.find((permission) => {
                    return permission.collection === collection && permission.action === 'update';
                });
                if (!permissions) {
                    throw new exceptions_1.ForbiddenException();
                }
                const allowedFields = (_b = permissions.fields) !== null && _b !== void 0 ? _b : [];
                if (allowedFields[0] !== '*' && allowedFields.includes(sortField) === false) {
                    throw new exceptions_1.ForbiddenException();
                }
            }
            const primaryKeyField = this.schema.tables[collection].primary;
            // Make sure all rows have a sort value
            const countResponse = yield this.knex.count('* as count').from(collection).whereNull(sortField).first();
            if ((countResponse === null || countResponse === void 0 ? void 0 : countResponse.count) && +countResponse.count !== 0) {
                const lastSortValueResponse = yield this.knex.max(sortField).from(collection).first();
                const rowsWithoutSortValue = yield this.knex
                    .select(primaryKeyField, sortField)
                    .from(collection)
                    .whereNull(sortField);
                let lastSortValue = lastSortValueResponse ? Object.values(lastSortValueResponse)[0] : 0;
                for (const row of rowsWithoutSortValue) {
                    lastSortValue++;
                    yield this.knex(collection)
                        .update({ [sortField]: lastSortValue })
                        .where({ [primaryKeyField]: row[primaryKeyField] });
                }
            }
            const targetSortValueResponse = yield this.knex
                .select(sortField)
                .from(collection)
                .where({ [primaryKeyField]: to })
                .first();
            const targetSortValue = targetSortValueResponse[sortField];
            const sourceSortValueResponse = yield this.knex
                .select(sortField)
                .from(collection)
                .where({ [primaryKeyField]: item })
                .first();
            const sourceSortValue = sourceSortValueResponse[sortField];
            // Set the target item to the new sort value
            yield this.knex(collection)
                .update({ [sortField]: targetSortValue })
                .where({ [primaryKeyField]: item });
            if (sourceSortValue < targetSortValue) {
                yield this.knex(collection)
                    .decrement(sortField, 1)
                    .where(sortField, '>', sourceSortValue)
                    .andWhere(sortField, '<=', targetSortValue)
                    .andWhereNot({ [primaryKeyField]: item });
            }
            else {
                yield this.knex(collection)
                    .increment(sortField, 1)
                    .where(sortField, '>=', targetSortValue)
                    .andWhere(sortField, '<=', sourceSortValue)
                    .andWhereNot({ [primaryKeyField]: item });
            }
        });
    }
}
exports.UtilsService = UtilsService;
