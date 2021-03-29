"use strict";
/**
 * Process a given payload for a collection to ensure the special fields (hash, uuid, date etc) are
 * handled correctly.
 */
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
exports.PayloadService = void 0;
const argon2_1 = __importDefault(require("argon2"));
const uuid_1 = require("uuid");
const database_1 = __importDefault(require("../database"));
const lodash_1 = require("lodash");
const items_1 = require("./items");
const get_local_type_1 = __importDefault(require("../utils/get-local-type"));
const date_fns_1 = require("date-fns");
const exceptions_1 = require("../exceptions");
const to_array_1 = require("../utils/to-array");
const fields_1 = require("../database/system-data/fields");
const relations_1 = require("../database/system-data/relations");
const exceptions_2 = require("../exceptions");
const lodash_2 = require("lodash");
const joi_1 = __importDefault(require("joi"));
class PayloadService {
    constructor(collection, options) {
        /**
         * @todo allow this to be extended
         *
         * @todo allow these extended special types to have "field dependencies"?
         * f.e. the file-links transformer needs the id and filename_download to be fetched from the DB
         * in order to work
         */
        this.transformers = {
            hash({ action, value }) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (!value)
                        return;
                    if (action === 'create' || action === 'update') {
                        return yield argon2_1.default.hash(String(value));
                    }
                    return value;
                });
            },
            uuid({ action, value }) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (action === 'create' && !value) {
                        return uuid_1.v4();
                    }
                    return value;
                });
            },
            boolean({ action, value }) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (action === 'read') {
                        return value === true || value === 1 || value === '1';
                    }
                    return value;
                });
            },
            json({ action, value }) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (action === 'read') {
                        if (typeof value === 'string') {
                            try {
                                return JSON.parse(value);
                            }
                            catch (_a) {
                                return value;
                            }
                        }
                    }
                    return value;
                });
            },
            conceal({ action, value }) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (action === 'read')
                        return value ? '**********' : null;
                    return value;
                });
            },
            'user-created'({ action, value, payload, accountability }) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (action === 'create')
                        return (accountability === null || accountability === void 0 ? void 0 : accountability.user) || null;
                    return value;
                });
            },
            'user-updated'({ action, value, payload, accountability }) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (action === 'update')
                        return (accountability === null || accountability === void 0 ? void 0 : accountability.user) || null;
                    return value;
                });
            },
            'role-created'({ action, value, payload, accountability }) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (action === 'create')
                        return (accountability === null || accountability === void 0 ? void 0 : accountability.role) || null;
                    return value;
                });
            },
            'role-updated'({ action, value, payload, accountability }) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (action === 'update')
                        return (accountability === null || accountability === void 0 ? void 0 : accountability.role) || null;
                    return value;
                });
            },
            'date-created'({ action, value }) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (action === 'create')
                        return new Date();
                    return value;
                });
            },
            'date-updated'({ action, value }) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (action === 'update')
                        return new Date();
                    return value;
                });
            },
            csv({ action, value }) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (!value)
                        return;
                    if (action === 'read')
                        return value.split(',');
                    if (Array.isArray(value))
                        return value.join(',');
                    return value;
                });
            },
        };
        this.accountability = options.accountability || null;
        this.knex = options.knex || database_1.default;
        this.collection = collection;
        this.schema = options.schema;
        return this;
    }
    processValues(action, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            let processedPayload = to_array_1.toArray(payload);
            if (processedPayload.length === 0)
                return [];
            const fieldsInPayload = Object.keys(processedPayload[0]);
            let specialFieldsInCollection = this.schema.fields.filter((field) => field.collection === this.collection && field.special && field.special.length > 0);
            specialFieldsInCollection.push(...fields_1.systemFieldRows
                .filter((fieldMeta) => fieldMeta.collection === this.collection)
                .map((fieldMeta) => {
                var _a;
                return ({
                    id: fieldMeta.id,
                    collection: fieldMeta.collection,
                    field: fieldMeta.field,
                    special: (_a = fieldMeta.special) !== null && _a !== void 0 ? _a : [],
                });
            }));
            if (action === 'read') {
                specialFieldsInCollection = specialFieldsInCollection.filter((fieldMeta) => {
                    return fieldsInPayload.includes(fieldMeta.field);
                });
            }
            yield Promise.all(processedPayload.map((record) => __awaiter(this, void 0, void 0, function* () {
                yield Promise.all(specialFieldsInCollection.map((field) => __awaiter(this, void 0, void 0, function* () {
                    const newValue = yield this.processField(field, record, action, this.accountability);
                    if (newValue !== undefined)
                        record[field.field] = newValue;
                })));
            })));
            if (action === 'read') {
                yield this.processDates(processedPayload);
            }
            if (['create', 'update'].includes(action)) {
                processedPayload.forEach((record) => {
                    for (const [key, value] of Object.entries(record)) {
                        if (Array.isArray(value) || (typeof value === 'object' && value instanceof Date !== true && value !== null)) {
                            record[key] = JSON.stringify(value);
                        }
                    }
                });
            }
            if (Array.isArray(payload)) {
                return processedPayload;
            }
            return processedPayload[0];
        });
    }
    processField(field, payload, action, accountability) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!field.special)
                return payload[field.field];
            const fieldSpecials = field.special ? to_array_1.toArray(field.special) : [];
            let value = lodash_1.clone(payload[field.field]);
            for (const special of fieldSpecials) {
                if (this.transformers.hasOwnProperty(special)) {
                    value = yield this.transformers[special]({
                        action,
                        value,
                        payload,
                        accountability,
                    });
                }
            }
            return value;
        });
    }
    /**
     * Knex returns `datetime` and `date` columns as Date.. This is wrong for date / datetime, as those
     * shouldn't return with time / timezone info respectively
     */
    processDates(payloads) {
        return __awaiter(this, void 0, void 0, function* () {
            const columnsInCollection = Object.values(this.schema.tables[this.collection].columns);
            const columnsWithType = columnsInCollection.map((column) => ({
                name: column.column_name,
                type: get_local_type_1.default(column),
            }));
            const dateColumns = columnsWithType.filter((column) => ['dateTime', 'date', 'timestamp'].includes(column.type));
            if (dateColumns.length === 0)
                return payloads;
            for (const dateColumn of dateColumns) {
                for (const payload of payloads) {
                    let value = payload[dateColumn.name];
                    if (value === null || value === '0000-00-00') {
                        payload[dateColumn.name] = null;
                        continue;
                    }
                    if (typeof value === 'string')
                        value = new Date(value);
                    if (value) {
                        if (dateColumn.type === 'timestamp') {
                            const newValue = date_fns_1.formatISO(value);
                            payload[dateColumn.name] = newValue;
                        }
                        if (dateColumn.type === 'dateTime') {
                            // Strip off the Z at the end of a non-timezone datetime value
                            const newValue = date_fns_1.format(value, "yyyy-MM-dd'T'HH:mm:ss");
                            payload[dateColumn.name] = newValue;
                        }
                        if (dateColumn.type === 'date') {
                            // Strip off the time / timezone information from a date-only value
                            const newValue = date_fns_1.format(value, 'yyyy-MM-dd');
                            payload[dateColumn.name] = newValue;
                        }
                    }
                }
            }
            return payloads;
        });
    }
    processA2O(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const relations = [
                ...this.schema.relations.filter((relation) => {
                    return relation.many_collection === this.collection;
                }),
                ...relations_1.systemRelationRows.filter((systemRelation) => systemRelation.many_collection === this.collection),
            ];
            const payloads = lodash_1.clone(to_array_1.toArray(payload));
            for (let i = 0; i < payloads.length; i++) {
                let payload = payloads[i];
                // Only process related records that are actually in the payload
                const relationsToProcess = relations.filter((relation) => {
                    return payload.hasOwnProperty(relation.many_field) && lodash_1.isObject(payload[relation.many_field]);
                });
                for (const relation of relationsToProcess) {
                    if (!relation.one_collection_field || !relation.one_allowed_collections)
                        continue;
                    if (lodash_2.isPlainObject(payload[relation.many_field]) === false)
                        continue;
                    const relatedCollection = payload[relation.one_collection_field];
                    if (!relatedCollection) {
                        throw new exceptions_2.InvalidPayloadException(`Can't update nested record "${relation.many_collection}.${relation.many_field}" without field "${relation.many_collection}.${relation.one_collection_field}" being set`);
                    }
                    const allowedCollections = relation.one_allowed_collections.split(',');
                    if (allowedCollections.includes(relatedCollection) === false) {
                        throw new exceptions_2.InvalidPayloadException(`"${relation.many_collection}.${relation.many_field}" can't be linked to collection "${relatedCollection}`);
                    }
                    const itemsService = new items_1.ItemsService(relatedCollection, {
                        accountability: this.accountability,
                        knex: this.knex,
                        schema: this.schema,
                    });
                    const relatedPrimary = this.schema.tables[relatedCollection].primary;
                    const relatedRecord = payload[relation.many_field];
                    const hasPrimaryKey = relatedRecord.hasOwnProperty(relatedPrimary);
                    let relatedPrimaryKey = relatedRecord[relatedPrimary];
                    const exists = hasPrimaryKey && !!(yield this.knex.select(relatedPrimary).from(relatedCollection).first());
                    if (exists) {
                        yield itemsService.update(relatedRecord, relatedPrimaryKey);
                    }
                    else {
                        relatedPrimaryKey = yield itemsService.create(relatedRecord);
                    }
                    // Overwrite the nested object with just the primary key, so the parent level can be saved correctly
                    payload[relation.many_field] = relatedPrimaryKey;
                }
            }
            return Array.isArray(payload) ? payloads : payloads[0];
        });
    }
    processM2O(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const relations = [
                ...this.schema.relations.filter((relation) => {
                    return relation.many_collection === this.collection;
                }),
                ...relations_1.systemRelationRows.filter((systemRelation) => systemRelation.many_collection === this.collection),
            ];
            const payloads = lodash_1.clone(to_array_1.toArray(payload));
            for (let i = 0; i < payloads.length; i++) {
                let payload = payloads[i];
                // Only process related records that are actually in the payload
                const relationsToProcess = relations.filter((relation) => {
                    return payload.hasOwnProperty(relation.many_field) && lodash_1.isObject(payload[relation.many_field]);
                });
                for (const relation of relationsToProcess) {
                    if (!relation.one_collection || !relation.one_primary)
                        continue;
                    const itemsService = new items_1.ItemsService(relation.one_collection, {
                        accountability: this.accountability,
                        knex: this.knex,
                        schema: this.schema,
                    });
                    const relatedRecord = payload[relation.many_field];
                    const hasPrimaryKey = relatedRecord.hasOwnProperty(relation.one_primary);
                    if (['string', 'number'].includes(typeof relatedRecord))
                        continue;
                    let relatedPrimaryKey = relatedRecord[relation.one_primary];
                    const exists = hasPrimaryKey && !!(yield this.knex.select(relation.one_primary).from(relation.one_collection).first());
                    if (exists) {
                        yield itemsService.update(relatedRecord, relatedPrimaryKey);
                    }
                    else {
                        relatedPrimaryKey = yield itemsService.create(relatedRecord);
                    }
                    // Overwrite the nested object with just the primary key, so the parent level can be saved correctly
                    payload[relation.many_field] = relatedPrimaryKey;
                }
            }
            return Array.isArray(payload) ? payloads : payloads[0];
        });
    }
    /**
     * Recursively save/update all nested related o2m items
     */
    processO2M(payload, parent) {
        return __awaiter(this, void 0, void 0, function* () {
            const nestedUpdateSchema = joi_1.default.object({
                create: joi_1.default.array().items(joi_1.default.object().unknown()),
                update: joi_1.default.array().items(joi_1.default.object().unknown()),
                delete: joi_1.default.array().items(joi_1.default.string(), joi_1.default.number()),
            });
            const relations = [
                ...this.schema.relations.filter((relation) => {
                    return relation.one_collection === this.collection;
                }),
                ...relations_1.systemRelationRows.filter((systemRelation) => systemRelation.one_collection === this.collection),
            ];
            const payloads = lodash_1.clone(to_array_1.toArray(payload));
            for (let i = 0; i < payloads.length; i++) {
                let payload = payloads[i];
                // Only process related records that are actually in the payload
                const relationsToProcess = relations.filter((relation) => {
                    if (!relation.one_field)
                        return false;
                    return payload.hasOwnProperty(relation.one_field);
                });
                for (const relation of relationsToProcess) {
                    if (!payload[relation.one_field])
                        continue;
                    const itemsService = new items_1.ItemsService(relation.many_collection, {
                        accountability: this.accountability,
                        knex: this.knex,
                        schema: this.schema,
                    });
                    const relatedRecords = [];
                    if (Array.isArray(payload[relation.one_field])) {
                        for (const relatedRecord of payload[relation.one_field] || []) {
                            let record = lodash_1.cloneDeep(relatedRecord);
                            if (typeof relatedRecord === 'string' || typeof relatedRecord === 'number') {
                                const exists = !!(yield this.knex
                                    .select(relation.many_primary)
                                    .from(relation.many_collection)
                                    .where({ [relation.many_primary]: record })
                                    .first());
                                if (exists === false) {
                                    throw new exceptions_1.ForbiddenException(undefined, {
                                        item: record,
                                        collection: relation.many_collection,
                                    });
                                }
                                record = {
                                    [relation.many_primary]: relatedRecord,
                                };
                            }
                            relatedRecords.push(Object.assign(Object.assign({}, record), { [relation.many_field]: parent || payload[relation.one_primary] }));
                        }
                        const savedPrimaryKeys = yield itemsService.upsert(relatedRecords);
                        yield itemsService.updateByQuery({ [relation.many_field]: null }, {
                            filter: {
                                _and: [
                                    {
                                        [relation.many_field]: {
                                            _eq: parent,
                                        },
                                    },
                                    {
                                        [relation.many_primary]: {
                                            _nin: savedPrimaryKeys,
                                        },
                                    },
                                ],
                            },
                        });
                    }
                    else {
                        const alterations = payload[relation.one_field];
                        const { error } = nestedUpdateSchema.validate(alterations);
                        if (error)
                            throw new exceptions_2.InvalidPayloadException(`Invalid one-to-many update structure: ${error.message}`);
                        if (alterations.create) {
                            yield itemsService.create(alterations.create.map((item) => (Object.assign(Object.assign({}, item), { [relation.many_field]: parent || payload[relation.one_primary] }))));
                        }
                        if (alterations.update) {
                            yield itemsService.update(alterations.update.map((item) => (Object.assign(Object.assign({}, item), { [relation.many_field]: parent || payload[relation.one_primary] }))));
                        }
                        if (alterations.delete) {
                            yield itemsService.updateByQuery({ [relation.many_field]: null }, {
                                filter: {
                                    _and: [
                                        {
                                            [relation.many_field]: {
                                                _eq: parent,
                                            },
                                        },
                                        {
                                            [relation.many_primary]: {
                                                _in: alterations.delete,
                                            },
                                        },
                                    ],
                                },
                            });
                        }
                    }
                }
            }
        });
    }
}
exports.PayloadService = PayloadService;
