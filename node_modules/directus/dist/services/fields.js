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
exports.FieldsService = void 0;
const constants_1 = require("../constants");
const database_1 = __importStar(require("../database"));
const items_1 = require("../services/items");
const get_local_type_1 = __importDefault(require("../utils/get-local-type"));
const exceptions_1 = require("../exceptions");
const payload_1 = require("../services/payload");
const get_default_value_1 = __importDefault(require("../utils/get-default-value"));
const cache_1 = __importDefault(require("../cache"));
const schema_1 = __importDefault(require("@directus/schema"));
const to_array_1 = require("../utils/to-array");
const env_1 = __importDefault(require("../env"));
const fields_1 = require("../database/system-data/fields/");
class FieldsService {
    constructor(options) {
        this.knex = options.knex || database_1.default;
        this.schemaInspector = options.knex ? schema_1.default(options.knex) : database_1.schemaInspector;
        this.accountability = options.accountability || null;
        this.itemsService = new items_1.ItemsService('directus_fields', options);
        this.payloadService = new payload_1.PayloadService('directus_fields', options);
        this.schema = options.schema;
    }
    get hasReadAccess() {
        return !!this.schema.permissions.find((permission) => {
            return permission.collection === 'directus_fields' && permission.action === 'read';
        });
    }
    readAll(collection) {
        return __awaiter(this, void 0, void 0, function* () {
            let fields;
            if (this.accountability && this.accountability.admin !== true && this.hasReadAccess === false) {
                throw new exceptions_1.ForbiddenException();
            }
            const nonAuthorizedItemsService = new items_1.ItemsService('directus_fields', {
                knex: this.knex,
                schema: this.schema,
            });
            if (collection) {
                fields = (yield nonAuthorizedItemsService.readByQuery({
                    filter: { collection: { _eq: collection } },
                    limit: -1,
                }));
                fields.push(...fields_1.systemFieldRows.filter((fieldMeta) => fieldMeta.collection === collection));
            }
            else {
                fields = (yield nonAuthorizedItemsService.readByQuery({ limit: -1 }));
                fields.push(...fields_1.systemFieldRows);
            }
            let columns = yield this.schemaInspector.columnInfo(collection);
            columns = columns.map((column) => {
                return Object.assign(Object.assign({}, column), { default_value: get_default_value_1.default(column) });
            });
            const columnsWithSystem = columns.map((column) => {
                const field = fields.find((field) => {
                    return field.field === column.name && field.collection === column.table;
                });
                const data = {
                    collection: column.table,
                    field: column.name,
                    type: column ? get_local_type_1.default(column, field) : 'alias',
                    schema: column,
                    meta: field || null,
                };
                return data;
            });
            const aliasQuery = this.knex.select('*').from('directus_fields');
            if (collection) {
                aliasQuery.andWhere('collection', collection);
            }
            let aliasFields = [...(yield this.payloadService.processValues('read', yield aliasQuery))];
            if (collection) {
                aliasFields.push(...fields_1.systemFieldRows.filter((fieldMeta) => fieldMeta.collection === collection));
            }
            else {
                aliasFields.push(...fields_1.systemFieldRows);
            }
            aliasFields = aliasFields.filter((field) => {
                const specials = to_array_1.toArray(field.special);
                for (const type of constants_1.ALIAS_TYPES) {
                    if (specials.includes(type))
                        return true;
                }
                return false;
            });
            const aliasFieldsAsField = aliasFields.map((field) => {
                const data = {
                    collection: field.collection,
                    field: field.field,
                    type: Array.isArray(field.special) ? field.special[0] : field.special,
                    schema: null,
                    meta: field,
                };
                return data;
            });
            const result = [...columnsWithSystem, ...aliasFieldsAsField];
            // Filter the result so we only return the fields you have read access to
            if (this.accountability && this.accountability.admin !== true) {
                const permissions = this.schema.permissions.filter((permission) => {
                    return permission.action === 'read';
                });
                const allowedFieldsInCollection = {};
                permissions.forEach((permission) => {
                    var _a;
                    allowedFieldsInCollection[permission.collection] = (_a = permission.fields) !== null && _a !== void 0 ? _a : [];
                });
                if (collection && allowedFieldsInCollection.hasOwnProperty(collection) === false) {
                    throw new exceptions_1.ForbiddenException();
                }
                return result.filter((field) => {
                    if (allowedFieldsInCollection.hasOwnProperty(field.collection) === false)
                        return false;
                    const allowedFields = allowedFieldsInCollection[field.collection];
                    if (allowedFields[0] === '*')
                        return true;
                    return allowedFields.includes(field.field);
                });
            }
            return result;
        });
    }
    readOne(collection, field) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.accountability && this.accountability.admin !== true) {
                if (this.hasReadAccess === false) {
                    throw new exceptions_1.ForbiddenException();
                }
                const permissions = this.schema.permissions.find((permission) => {
                    return permission.action === 'read' && permission.collection === collection;
                });
                if (!permissions || !permissions.fields)
                    throw new exceptions_1.ForbiddenException();
                if (permissions.fields.includes('*') === false) {
                    const allowedFields = permissions.fields;
                    if (allowedFields.includes(field) === false)
                        throw new exceptions_1.ForbiddenException();
                }
            }
            let column;
            let fieldInfo = yield this.knex.select('*').from('directus_fields').where({ collection, field }).first();
            if (fieldInfo) {
                fieldInfo = (yield this.payloadService.processValues('read', fieldInfo));
            }
            fieldInfo =
                fieldInfo ||
                    fields_1.systemFieldRows.find((fieldMeta) => fieldMeta.collection === collection && fieldMeta.field === field);
            try {
                column = yield this.schemaInspector.columnInfo(collection, field);
                column.default_value = get_default_value_1.default(column);
            }
            catch (_a) { }
            const data = {
                collection,
                field,
                type: column ? get_local_type_1.default(column, fieldInfo) : 'alias',
                meta: fieldInfo || null,
                schema: column || null,
            };
            return data;
        });
    }
    createField(collection, field, table // allows collection creation to
    ) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.accountability && this.accountability.admin !== true) {
                throw new exceptions_1.ForbiddenException('Only admins can perform this action.');
            }
            // Check if field already exists, either as a column, or as a row in directus_fields
            if (field.field in this.schema.tables[collection].columns) {
                throw new exceptions_1.InvalidPayloadException(`Field "${field.field}" already exists in collection "${collection}"`);
            }
            else if (!!this.schema.fields.find((fieldMeta) => fieldMeta.collection === collection && fieldMeta.field === field.field)) {
                throw new exceptions_1.InvalidPayloadException(`Field "${field.field}" already exists in collection "${collection}"`);
            }
            yield this.knex.transaction((trx) => __awaiter(this, void 0, void 0, function* () {
                const itemsService = new items_1.ItemsService('directus_fields', {
                    knex: trx,
                    accountability: this.accountability,
                    schema: this.schema,
                });
                if (field.type && constants_1.ALIAS_TYPES.includes(field.type) === false) {
                    if (table) {
                        this.addColumnToTable(table, field);
                    }
                    else {
                        yield trx.schema.alterTable(collection, (table) => {
                            this.addColumnToTable(table, field);
                        });
                    }
                }
                if (field.meta) {
                    yield itemsService.create(Object.assign(Object.assign({}, field.meta), { collection: collection, field: field.field }));
                }
            }));
            if (cache_1.default && env_1.default.CACHE_AUTO_PURGE) {
                yield cache_1.default.clear();
            }
        });
    }
    updateField(collection, field) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.accountability && this.accountability.admin !== true) {
                throw new exceptions_1.ForbiddenException('Only admins can perform this action');
            }
            if (field.schema) {
                const existingColumn = yield this.schemaInspector.columnInfo(collection, field.field);
                yield this.knex.schema.alterTable(collection, (table) => {
                    if (!field.schema)
                        return;
                    this.addColumnToTable(table, field, existingColumn);
                });
            }
            if (field.meta) {
                const record = this.schema.fields.find((fieldMeta) => fieldMeta.field === field.field && fieldMeta.collection === collection);
                if (record) {
                    yield this.itemsService.update(Object.assign(Object.assign({}, field.meta), { collection: collection, field: field.field }), record.id);
                }
                else {
                    yield this.itemsService.create(Object.assign(Object.assign({}, field.meta), { collection: collection, field: field.field }));
                }
            }
            if (cache_1.default && env_1.default.CACHE_AUTO_PURGE) {
                yield cache_1.default.clear();
            }
            return field.field;
        });
    }
    /** @todo save accountability */
    deleteField(collection, field) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.accountability && this.accountability.admin !== true) {
                throw new exceptions_1.ForbiddenException('Only admins can perform this action.');
            }
            yield this.knex('directus_fields').delete().where({ collection, field });
            if (this.schema.tables[collection] && field in this.schema.tables[collection].columns) {
                yield this.knex.schema.table(collection, (table) => {
                    table.dropColumn(field);
                });
            }
            const relations = this.schema.relations.filter((relation) => {
                return ((relation.many_collection === collection && relation.many_field === field) ||
                    (relation.one_collection === collection && relation.one_field === field));
            });
            for (const relation of relations) {
                const isM2O = relation.many_collection === collection && relation.many_field === field;
                /** @TODO M2A — Handle m2a case here */
                if (isM2O) {
                    yield this.knex('directus_relations').delete().where({ many_collection: collection, many_field: field });
                    yield this.deleteField(relation.one_collection, relation.one_field);
                }
                else {
                    yield this.knex('directus_relations')
                        .update({ one_field: null })
                        .where({ one_collection: collection, one_field: field });
                }
            }
            if (cache_1.default && env_1.default.CACHE_AUTO_PURGE) {
                yield cache_1.default.clear();
            }
        });
    }
    addColumnToTable(table, field, alter = null) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        let column;
        if ((_a = field.schema) === null || _a === void 0 ? void 0 : _a.has_auto_increment) {
            column = table.increments(field.field);
        }
        else if (field.type === 'string') {
            column = table.string(field.field, (_c = (_b = field.schema) === null || _b === void 0 ? void 0 : _b.max_length) !== null && _c !== void 0 ? _c : undefined);
        }
        else if (['float', 'decimal'].includes(field.type)) {
            const type = field.type;
            column = table[type](field.field, ((_d = field.schema) === null || _d === void 0 ? void 0 : _d.numeric_precision) || 10, ((_e = field.schema) === null || _e === void 0 ? void 0 : _e.numeric_scale) || 5);
        }
        else if (field.type === 'csv') {
            column = table.string(field.field);
        }
        else if (field.type === 'hash') {
            column = table.string(field.field, 255);
        }
        else {
            column = table[field.type](field.field);
        }
        if (((_f = field.schema) === null || _f === void 0 ? void 0 : _f.default_value) !== undefined) {
            if (typeof field.schema.default_value === 'string' && field.schema.default_value.toLowerCase() === 'now()') {
                column.defaultTo(this.knex.fn.now());
            }
            else if (typeof field.schema.default_value === 'string' &&
                ['"null"', 'null'].includes(field.schema.default_value.toLowerCase())) {
                column.defaultTo(null);
            }
            else {
                column.defaultTo(field.schema.default_value);
            }
        }
        if (((_g = field.schema) === null || _g === void 0 ? void 0 : _g.is_nullable) !== undefined && field.schema.is_nullable === false) {
            column.notNullable();
        }
        else {
            column.nullable();
        }
        if (((_h = field.schema) === null || _h === void 0 ? void 0 : _h.is_unique) === true) {
            if (!alter || alter.is_unique === false) {
                column.unique();
            }
        }
        else if (((_j = field.schema) === null || _j === void 0 ? void 0 : _j.is_unique) === false) {
            if (alter && alter.is_unique === true) {
                table.dropUnique([field.field]);
            }
        }
        if ((_k = field.schema) === null || _k === void 0 ? void 0 : _k.is_primary_key) {
            column.primary();
        }
        if (alter) {
            column.alter();
        }
    }
}
exports.FieldsService = FieldsService;
