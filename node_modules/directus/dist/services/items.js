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
exports.ItemsService = void 0;
const database_1 = __importDefault(require("../database"));
const run_ast_1 = __importDefault(require("../database/run-ast"));
const get_ast_from_query_1 = __importDefault(require("../utils/get-ast-from-query"));
const types_1 = require("../types");
const cache_1 = __importDefault(require("../cache"));
const emitter_1 = __importStar(require("../emitter"));
const to_array_1 = require("../utils/to-array");
const env_1 = __importDefault(require("../env"));
const payload_1 = require("./payload");
const authorization_1 = require("./authorization");
const lodash_1 = require("lodash");
const get_default_value_1 = __importDefault(require("../utils/get-default-value"));
const translate_1 = require("../exceptions/database/translate");
const exceptions_1 = require("../exceptions");
class ItemsService {
    constructor(collection, options) {
        this.collection = collection;
        this.knex = options.knex || database_1.default;
        this.accountability = options.accountability || null;
        this.eventScope = this.collection.startsWith('directus_') ? this.collection.substring(9) : 'items';
        this.schema = options.schema;
        return this;
    }
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const primaryKeyField = this.schema.tables[this.collection].primary;
            const columns = Object.keys(this.schema.tables[this.collection].columns);
            let payloads = lodash_1.clone(to_array_1.toArray(data));
            const savedPrimaryKeys = yield this.knex.transaction((trx) => __awaiter(this, void 0, void 0, function* () {
                const payloadService = new payload_1.PayloadService(this.collection, {
                    accountability: this.accountability,
                    knex: trx,
                    schema: this.schema,
                });
                for (let i = 0; i < payloads.length; i++) {
                    const customProcessed = yield emitter_1.default.emitAsync(`${this.eventScope}.create.before`, payloads[i], {
                        event: `${this.eventScope}.create.before`,
                        accountability: this.accountability,
                        collection: this.collection,
                        item: null,
                        action: 'create',
                        payload: payloads[i],
                        schema: this.schema,
                    });
                    if (customProcessed && customProcessed.length > 0) {
                        payloads[i] = customProcessed.reverse().reduce((val, acc) => lodash_1.merge(acc, val));
                    }
                }
                if (this.accountability) {
                    const authorizationService = new authorization_1.AuthorizationService({
                        accountability: this.accountability,
                        knex: trx,
                        schema: this.schema,
                    });
                    payloads = yield authorizationService.validatePayload('create', this.collection, payloads);
                }
                payloads = yield payloadService.processM2O(payloads);
                payloads = yield payloadService.processA2O(payloads);
                let payloadsWithoutAliases = payloads.map((payload) => lodash_1.pick(payload, columns));
                payloadsWithoutAliases = yield payloadService.processValues('create', payloadsWithoutAliases);
                const primaryKeys = [];
                for (const payloadWithoutAlias of payloadsWithoutAliases) {
                    // string / uuid primary
                    let primaryKey = payloadWithoutAlias[primaryKeyField];
                    try {
                        yield trx.insert(payloadWithoutAlias).into(this.collection);
                    }
                    catch (err) {
                        throw yield translate_1.translateDatabaseError(err);
                    }
                    // Auto-incremented id
                    if (!primaryKey) {
                        const result = yield trx
                            .select(primaryKeyField)
                            .from(this.collection)
                            .orderBy(primaryKeyField, 'desc')
                            .first();
                        primaryKey = result[primaryKeyField];
                    }
                    primaryKeys.push(primaryKey);
                }
                payloads = payloads.map((payload, index) => {
                    payload[primaryKeyField] = primaryKeys[index];
                    return payload;
                });
                for (const key of primaryKeys) {
                    yield payloadService.processO2M(payloads, key);
                }
                if (this.accountability) {
                    const activityRecords = primaryKeys.map((key) => ({
                        action: types_1.Action.CREATE,
                        user: this.accountability.user,
                        collection: this.collection,
                        ip: this.accountability.ip,
                        user_agent: this.accountability.userAgent,
                        item: key,
                    }));
                    const activityPrimaryKeys = [];
                    for (const activityRecord of activityRecords) {
                        yield trx.insert(activityRecord).into('directus_activity');
                        let primaryKey;
                        const result = yield trx.select('id').from('directus_activity').orderBy('id', 'desc').first();
                        primaryKey = result.id;
                        activityPrimaryKeys.push(primaryKey);
                    }
                    const revisionRecords = activityPrimaryKeys.map((key, index) => ({
                        activity: key,
                        collection: this.collection,
                        item: primaryKeys[index],
                        data: JSON.stringify(payloads[index]),
                        delta: JSON.stringify(payloads[index]),
                    }));
                    if (revisionRecords.length > 0) {
                        yield trx.insert(revisionRecords).into('directus_revisions');
                    }
                }
                if (cache_1.default && env_1.default.CACHE_AUTO_PURGE) {
                    yield cache_1.default.clear();
                }
                return primaryKeys;
            }));
            emitter_1.emitAsyncSafe(`${this.eventScope}.create`, {
                event: `${this.eventScope}.create`,
                accountability: this.accountability,
                collection: this.collection,
                item: savedPrimaryKeys,
                action: 'create',
                payload: payloads,
                schema: this.schema,
            });
            return Array.isArray(data) ? savedPrimaryKeys : savedPrimaryKeys[0];
        });
    }
    readByQuery(query, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const authorizationService = new authorization_1.AuthorizationService({
                accountability: this.accountability,
                knex: this.knex,
                schema: this.schema,
            });
            let ast = yield get_ast_from_query_1.default(this.collection, query, this.schema, {
                accountability: this.accountability,
                knex: this.knex,
            });
            if (this.accountability && this.accountability.admin !== true) {
                ast = yield authorizationService.processAST(ast);
            }
            const records = yield run_ast_1.default(ast, this.schema, {
                knex: this.knex,
                stripNonRequested: (opts === null || opts === void 0 ? void 0 : opts.stripNonRequested) !== undefined ? opts.stripNonRequested : true,
            });
            return records;
        });
    }
    readByKey(key, query = {}, action = 'read') {
        return __awaiter(this, void 0, void 0, function* () {
            query = lodash_1.clone(query);
            const primaryKeyField = this.schema.tables[this.collection].primary;
            const keys = to_array_1.toArray(key);
            if (keys.length === 1) {
                query.single = true;
            }
            const queryWithFilter = Object.assign(Object.assign({}, query), { filter: Object.assign(Object.assign({}, (query.filter || {})), { [primaryKeyField]: {
                        _in: keys,
                    } }) });
            let ast = yield get_ast_from_query_1.default(this.collection, queryWithFilter, this.schema, {
                accountability: this.accountability,
                action,
                knex: this.knex,
            });
            if (this.accountability && this.accountability.admin !== true) {
                const authorizationService = new authorization_1.AuthorizationService({
                    accountability: this.accountability,
                    knex: this.knex,
                    schema: this.schema,
                });
                ast = yield authorizationService.processAST(ast, action);
            }
            const result = yield run_ast_1.default(ast, this.schema, { knex: this.knex });
            if (result === null)
                throw new exceptions_1.ForbiddenException();
            return result;
        });
    }
    update(data, key) {
        return __awaiter(this, void 0, void 0, function* () {
            const primaryKeyField = this.schema.tables[this.collection].primary;
            const columns = Object.keys(this.schema.tables[this.collection].columns);
            // Updating one or more items to the same payload
            if (data && key) {
                const keys = to_array_1.toArray(key);
                let payload = lodash_1.clone(data);
                const customProcessed = yield emitter_1.default.emitAsync(`${this.eventScope}.update.before`, payload, {
                    event: `${this.eventScope}.update.before`,
                    accountability: this.accountability,
                    collection: this.collection,
                    item: key,
                    action: 'update',
                    payload,
                    schema: this.schema,
                });
                if (customProcessed && customProcessed.length > 0) {
                    payload = customProcessed.reverse().reduce((val, acc) => lodash_1.merge(acc, val));
                }
                if (this.accountability) {
                    const authorizationService = new authorization_1.AuthorizationService({
                        accountability: this.accountability,
                        knex: this.knex,
                        schema: this.schema,
                    });
                    yield authorizationService.checkAccess('update', this.collection, keys);
                    payload = yield authorizationService.validatePayload('update', this.collection, payload);
                }
                yield this.knex.transaction((trx) => __awaiter(this, void 0, void 0, function* () {
                    const payloadService = new payload_1.PayloadService(this.collection, {
                        accountability: this.accountability,
                        knex: trx,
                        schema: this.schema,
                    });
                    payload = yield payloadService.processM2O(payload);
                    payload = yield payloadService.processA2O(payload);
                    let payloadWithoutAliases = lodash_1.pick(payload, columns);
                    payloadWithoutAliases = yield payloadService.processValues('update', payloadWithoutAliases);
                    if (Object.keys(payloadWithoutAliases).length > 0) {
                        try {
                            yield trx(this.collection).update(payloadWithoutAliases).whereIn(primaryKeyField, keys);
                        }
                        catch (err) {
                            throw yield translate_1.translateDatabaseError(err);
                        }
                    }
                    for (const key of keys) {
                        yield payloadService.processO2M(payload, key);
                    }
                    if (this.accountability) {
                        const activityRecords = keys.map((key) => ({
                            action: types_1.Action.UPDATE,
                            user: this.accountability.user,
                            collection: this.collection,
                            ip: this.accountability.ip,
                            user_agent: this.accountability.userAgent,
                            item: key,
                        }));
                        const activityPrimaryKeys = [];
                        for (const activityRecord of activityRecords) {
                            yield trx.insert(activityRecord).into('directus_activity');
                            let primaryKey;
                            const result = yield trx.select('id').from('directus_activity').orderBy('id', 'desc').first();
                            primaryKey = result.id;
                            activityPrimaryKeys.push(primaryKey);
                        }
                        const itemsService = new ItemsService(this.collection, {
                            knex: trx,
                            schema: this.schema,
                        });
                        const snapshots = yield itemsService.readByKey(keys);
                        const revisionRecords = activityPrimaryKeys.map((key, index) => ({
                            activity: key,
                            collection: this.collection,
                            item: keys[index],
                            data: snapshots && Array.isArray(snapshots) ? JSON.stringify(snapshots === null || snapshots === void 0 ? void 0 : snapshots[index]) : JSON.stringify(snapshots),
                            delta: JSON.stringify(payloadWithoutAliases),
                        }));
                        if (revisionRecords.length > 0) {
                            yield trx.insert(revisionRecords).into('directus_revisions');
                        }
                    }
                }));
                if (cache_1.default && env_1.default.CACHE_AUTO_PURGE) {
                    yield cache_1.default.clear();
                }
                emitter_1.emitAsyncSafe(`${this.eventScope}.update`, {
                    event: `${this.eventScope}.update`,
                    accountability: this.accountability,
                    collection: this.collection,
                    item: key,
                    action: 'update',
                    payload,
                    schema: this.schema,
                });
                return key;
            }
            const keys = [];
            yield this.knex.transaction((trx) => __awaiter(this, void 0, void 0, function* () {
                const itemsService = new ItemsService(this.collection, {
                    accountability: this.accountability,
                    knex: trx,
                    schema: this.schema,
                });
                const payloads = to_array_1.toArray(data);
                for (const single of payloads) {
                    const payload = lodash_1.clone(single);
                    const key = payload[primaryKeyField];
                    if (!key) {
                        throw new exceptions_1.InvalidPayloadException('Primary key is missing in update payload.');
                    }
                    keys.push(key);
                    yield itemsService.update(payload, key);
                }
            }));
            return keys;
        });
    }
    updateByQuery(data, query) {
        return __awaiter(this, void 0, void 0, function* () {
            const primaryKeyField = this.schema.tables[this.collection].primary;
            const readQuery = lodash_1.cloneDeep(query);
            readQuery.fields = [primaryKeyField];
            // Not authenticated:
            const itemsService = new ItemsService(this.collection, {
                knex: this.knex,
                schema: this.schema,
            });
            let itemsToUpdate = yield itemsService.readByQuery(readQuery);
            itemsToUpdate = to_array_1.toArray(itemsToUpdate);
            const keys = itemsToUpdate.map((item) => item[primaryKeyField]);
            return yield this.update(data, keys);
        });
    }
    upsert(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const primaryKeyField = this.schema.tables[this.collection].primary;
            const payloads = to_array_1.toArray(data);
            const primaryKeys = [];
            for (const payload of payloads) {
                const primaryKey = payload[primaryKeyField];
                const exists = primaryKey &&
                    !!(yield this.knex
                        .select(primaryKeyField)
                        .from(this.collection)
                        .where({ [primaryKeyField]: primaryKey })
                        .first());
                if (exists) {
                    const keys = yield this.update([payload]);
                    primaryKeys.push(...keys);
                }
                else {
                    const key = yield this.create(payload);
                    primaryKeys.push(key);
                }
            }
            return Array.isArray(data) ? primaryKeys : primaryKeys[0];
        });
    }
    delete(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const keys = to_array_1.toArray(key);
            const primaryKeyField = this.schema.tables[this.collection].primary;
            if (this.accountability && this.accountability.admin !== true) {
                const authorizationService = new authorization_1.AuthorizationService({
                    accountability: this.accountability,
                    schema: this.schema,
                });
                yield authorizationService.checkAccess('delete', this.collection, keys);
            }
            yield emitter_1.default.emitAsync(`${this.eventScope}.delete.before`, {
                event: `${this.eventScope}.delete.before`,
                accountability: this.accountability,
                collection: this.collection,
                item: keys,
                action: 'delete',
                payload: null,
                schema: this.schema,
            });
            yield this.knex.transaction((trx) => __awaiter(this, void 0, void 0, function* () {
                yield trx(this.collection).whereIn(primaryKeyField, keys).delete();
                if (this.accountability) {
                    const activityRecords = keys.map((key) => ({
                        action: types_1.Action.DELETE,
                        user: this.accountability.user,
                        collection: this.collection,
                        ip: this.accountability.ip,
                        user_agent: this.accountability.userAgent,
                        item: key,
                    }));
                    if (activityRecords.length > 0) {
                        yield trx.insert(activityRecords).into('directus_activity');
                    }
                }
            }));
            if (cache_1.default && env_1.default.CACHE_AUTO_PURGE) {
                yield cache_1.default.clear();
            }
            emitter_1.emitAsyncSafe(`${this.eventScope}.delete`, {
                event: `${this.eventScope}.delete`,
                accountability: this.accountability,
                collection: this.collection,
                item: keys,
                action: 'delete',
                payload: null,
                schema: this.schema,
            });
            return key;
        });
    }
    deleteByQuery(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const primaryKeyField = this.schema.tables[this.collection].primary;
            const readQuery = lodash_1.cloneDeep(query);
            readQuery.fields = [primaryKeyField];
            // Not authenticated:
            const itemsService = new ItemsService(this.collection, {
                knex: this.knex,
                schema: this.schema,
            });
            let itemsToDelete = yield itemsService.readByQuery(readQuery);
            itemsToDelete = to_array_1.toArray(itemsToDelete);
            const keys = itemsToDelete.map((item) => item[primaryKeyField]);
            return yield this.delete(keys);
        });
    }
    readSingleton(query, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            query = lodash_1.clone(query);
            query.single = true;
            const record = (yield this.readByQuery(query, opts));
            if (!record) {
                let columns = Object.values(this.schema.tables[this.collection].columns);
                const defaults = {};
                if (query.fields && query.fields.includes('*') === false) {
                    columns = columns.filter((column) => {
                        return query.fields.includes(column.column_name);
                    });
                }
                for (const column of columns) {
                    defaults[column.column_name] = get_default_value_1.default(column);
                }
                return defaults;
            }
            return record;
        });
    }
    upsertSingleton(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const primaryKeyField = this.schema.tables[this.collection].primary;
            const record = yield this.knex.select(primaryKeyField).from(this.collection).limit(1).first();
            if (record) {
                return yield this.update(data, record.id);
            }
            return yield this.create(data);
        });
    }
}
exports.ItemsService = ItemsService;
