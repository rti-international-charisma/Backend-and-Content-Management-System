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
exports.CollectionsService = void 0;
const database_1 = __importStar(require("../database"));
const exceptions_1 = require("../exceptions");
const fields_1 = require("../services/fields");
const items_1 = require("../services/items");
const cache_1 = __importDefault(require("../cache"));
const to_array_1 = require("../utils/to-array");
const collections_1 = require("../database/system-data/collections");
const env_1 = __importDefault(require("../env"));
class CollectionsService {
    constructor(options) {
        this.knex = options.knex || database_1.default;
        this.accountability = options.accountability || null;
        this.schema = options.schema;
    }
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.accountability && this.accountability.admin !== true) {
                throw new exceptions_1.ForbiddenException('Only admins can perform this action.');
            }
            const payloads = to_array_1.toArray(data).map((collection) => {
                if (!collection.fields)
                    collection.fields = [];
                collection.fields = collection.fields.map((field) => {
                    if (field.meta) {
                        field.meta = Object.assign(Object.assign({}, field.meta), { field: field.field, collection: collection.collection });
                    }
                    return field;
                });
                return collection;
            });
            const createdCollections = [];
            yield this.knex.transaction((trx) => __awaiter(this, void 0, void 0, function* () {
                const fieldsService = new fields_1.FieldsService({ knex: trx, schema: this.schema });
                const collectionItemsService = new items_1.ItemsService('directus_collections', {
                    knex: trx,
                    accountability: this.accountability,
                    schema: this.schema,
                });
                const fieldItemsService = new items_1.ItemsService('directus_fields', {
                    knex: trx,
                    accountability: this.accountability,
                    schema: this.schema,
                });
                for (const payload of payloads) {
                    if (!payload.collection) {
                        throw new exceptions_1.InvalidPayloadException(`The "collection" key is required.`);
                    }
                    if (payload.collection.startsWith('directus_')) {
                        throw new exceptions_1.InvalidPayloadException(`Collections can't start with "directus_"`);
                    }
                    if (payload.collection in this.schema.tables) {
                        throw new exceptions_1.InvalidPayloadException(`Collection "${payload.collection}" already exists.`);
                    }
                    yield trx.schema.createTable(payload.collection, (table) => {
                        for (const field of payload.fields) {
                            fieldsService.addColumnToTable(table, field);
                        }
                    });
                    yield collectionItemsService.create(Object.assign(Object.assign({}, (payload.meta || {})), { collection: payload.collection }));
                    const fieldPayloads = payload.fields.filter((field) => field.meta).map((field) => field.meta);
                    yield fieldItemsService.create(fieldPayloads);
                    createdCollections.push(payload.collection);
                }
            }));
            if (cache_1.default && env_1.default.CACHE_AUTO_PURGE) {
                yield cache_1.default.clear();
            }
            return Array.isArray(data) ? createdCollections : createdCollections[0];
        });
    }
    readByKey(collection) {
        return __awaiter(this, void 0, void 0, function* () {
            const collectionItemsService = new items_1.ItemsService('directus_collections', {
                knex: this.knex,
                accountability: this.accountability,
                schema: this.schema,
            });
            const collectionKeys = to_array_1.toArray(collection);
            if (this.accountability && this.accountability.admin !== true) {
                const permissions = this.schema.permissions.filter((permission) => {
                    return permission.action === 'read' && collectionKeys.includes(permission.collection);
                });
                if (collectionKeys.length !== permissions.length) {
                    const collectionsYouHavePermissionToRead = permissions.map(({ collection }) => collection);
                    for (const collectionKey of collectionKeys) {
                        if (collectionsYouHavePermissionToRead.includes(collectionKey) === false) {
                            throw new exceptions_1.ForbiddenException(`You don't have access to the "${collectionKey}" collection.`);
                        }
                    }
                }
            }
            const tablesInDatabase = yield database_1.schemaInspector.tableInfo();
            const tables = tablesInDatabase.filter((table) => collectionKeys.includes(table.name));
            const meta = (yield collectionItemsService.readByQuery({
                filter: { collection: { _in: collectionKeys } },
                limit: -1,
            }));
            meta.push(...collections_1.systemCollectionRows);
            const collections = [];
            for (const table of tables) {
                const collection = {
                    collection: table.name,
                    meta: meta.find((systemInfo) => (systemInfo === null || systemInfo === void 0 ? void 0 : systemInfo.collection) === table.name) || null,
                    schema: table,
                };
                collections.push(collection);
            }
            return Array.isArray(collection) ? collections : collections[0];
        });
    }
    /** @todo, read by query without query support is a bit ironic, isn't it */
    readByQuery() {
        return __awaiter(this, void 0, void 0, function* () {
            const collectionItemsService = new items_1.ItemsService('directus_collections', {
                knex: this.knex,
                schema: this.schema,
                accountability: this.accountability,
            });
            let tablesInDatabase = yield database_1.schemaInspector.tableInfo();
            if (this.accountability && this.accountability.admin !== true) {
                const collectionsYouHavePermissionToRead = this.schema.permissions
                    .filter((permission) => {
                    return permission.action === 'read';
                })
                    .map(({ collection }) => collection);
                tablesInDatabase = tablesInDatabase.filter((table) => {
                    return collectionsYouHavePermissionToRead.includes(table.name);
                });
            }
            const tablesToFetchInfoFor = tablesInDatabase.map((table) => table.name);
            const meta = (yield collectionItemsService.readByQuery({
                filter: { collection: { _in: tablesToFetchInfoFor } },
                limit: -1,
            }));
            meta.push(...collections_1.systemCollectionRows);
            const collections = [];
            for (const table of tablesInDatabase) {
                const collection = {
                    collection: table.name,
                    meta: meta.find((systemInfo) => (systemInfo === null || systemInfo === void 0 ? void 0 : systemInfo.collection) === table.name) || null,
                    schema: table,
                };
                collections.push(collection);
            }
            return collections;
        });
    }
    update(data, key) {
        return __awaiter(this, void 0, void 0, function* () {
            const collectionItemsService = new items_1.ItemsService('directus_collections', {
                knex: this.knex,
                accountability: this.accountability,
                schema: this.schema,
            });
            if (data && key) {
                const payload = data;
                if (!payload.meta) {
                    throw new exceptions_1.InvalidPayloadException(`"meta" key is required`);
                }
                const keys = to_array_1.toArray(key);
                for (const key of keys) {
                    const exists = (yield this.knex.select('collection').from('directus_collections').where({ collection: key }).first()) !==
                        undefined;
                    if (exists) {
                        yield collectionItemsService.update(payload.meta, key);
                    }
                    else {
                        yield collectionItemsService.create(Object.assign(Object.assign({}, payload.meta), { collection: key }));
                    }
                }
                return key;
            }
            const payloads = to_array_1.toArray(data);
            const collectionUpdates = payloads.map((collection) => {
                return Object.assign(Object.assign({}, collection.meta), { collection: collection.collection });
            });
            yield collectionItemsService.update(collectionUpdates);
            if (cache_1.default && env_1.default.CACHE_AUTO_PURGE) {
                yield cache_1.default.clear();
            }
            return key;
        });
    }
    delete(collection) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.accountability && this.accountability.admin !== true) {
                throw new exceptions_1.ForbiddenException('Only admins can perform this action.');
            }
            const collectionItemsService = new items_1.ItemsService('directus_collections', {
                knex: this.knex,
                accountability: this.accountability,
                schema: this.schema,
            });
            const fieldsService = new fields_1.FieldsService({
                knex: this.knex,
                accountability: this.accountability,
                schema: this.schema,
            });
            const tablesInDatabase = Object.keys(this.schema.tables);
            const collectionKeys = to_array_1.toArray(collection);
            for (const collectionKey of collectionKeys) {
                if (tablesInDatabase.includes(collectionKey) === false) {
                    throw new exceptions_1.InvalidPayloadException(`Collection "${collectionKey}" doesn't exist.`);
                }
            }
            yield collectionItemsService.delete(collectionKeys);
            yield this.knex('directus_fields').delete().whereIn('collection', collectionKeys);
            yield this.knex('directus_presets').delete().whereIn('collection', collectionKeys);
            yield this.knex('directus_revisions').delete().whereIn('collection', collectionKeys);
            yield this.knex('directus_activity').delete().whereIn('collection', collectionKeys);
            yield this.knex('directus_permissions').delete().whereIn('collection', collectionKeys);
            const relations = this.schema.relations.filter((relation) => {
                return relation.many_collection === collection || relation.one_collection === collection;
            });
            for (const relation of relations) {
                const isM2O = relation.many_collection === collection;
                if (isM2O) {
                    yield this.knex('directus_relations')
                        .delete()
                        .where({ many_collection: collection, many_field: relation.many_field });
                    yield fieldsService.deleteField(relation.one_collection, relation.one_field);
                }
                else if (!!relation.one_collection) {
                    yield this.knex('directus_relations')
                        .update({ one_field: null })
                        .where({ one_collection: collection, one_field: relation.one_field });
                    yield fieldsService.deleteField(relation.many_collection, relation.many_field);
                }
            }
            for (const collectionKey of collectionKeys) {
                yield this.knex.schema.dropTable(collectionKey);
            }
            if (cache_1.default && env_1.default.CACHE_AUTO_PURGE) {
                yield cache_1.default.clear();
            }
            return collection;
        });
    }
}
exports.CollectionsService = CollectionsService;
