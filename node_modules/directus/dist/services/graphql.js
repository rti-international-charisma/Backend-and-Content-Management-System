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
exports.GraphQLService = void 0;
const database_1 = __importDefault(require("../database"));
const graphql_1 = require("graphql");
const logger_1 = __importDefault(require("../logger"));
const get_graphql_type_1 = require("../utils/get-graphql-type");
const relations_1 = require("./relations");
const items_1 = require("./items");
const lodash_1 = require("lodash");
const sanitize_query_1 = require("../utils/sanitize-query");
const activity_1 = require("./activity");
const collections_1 = require("./collections");
const fields_1 = require("./fields");
const files_1 = require("./files");
const folders_1 = require("./folders");
const permissions_1 = require("./permissions");
const presets_1 = require("./presets");
const revisions_1 = require("./revisions");
const roles_1 = require("./roles");
const settings_1 = require("./settings");
const users_1 = require("./users");
const webhooks_1 = require("./webhooks");
const get_relation_type_1 = require("../utils/get-relation-type");
const collections_2 = require("../database/system-data/collections");
class GraphQLService {
    constructor(options) {
        this.args = {
            sort: {
                type: new graphql_1.GraphQLList(graphql_1.GraphQLString),
            },
            limit: {
                type: graphql_1.GraphQLInt,
            },
            offset: {
                type: graphql_1.GraphQLInt,
            },
            page: {
                type: graphql_1.GraphQLInt,
            },
            search: {
                type: graphql_1.GraphQLString,
            },
        };
        this.accountability = (options === null || options === void 0 ? void 0 : options.accountability) || null;
        this.knex = (options === null || options === void 0 ? void 0 : options.knex) || database_1.default;
        this.fieldsService = new fields_1.FieldsService(options);
        this.collectionsService = new collections_1.CollectionsService(options);
        this.relationsService = new relations_1.RelationsService(options);
        this.schema = options.schema;
    }
    getSchema() {
        return __awaiter(this, void 0, void 0, function* () {
            let collectionsInSystem = [];
            // Collections service will throw an error if you don't have access to any collection.
            // We still want GraphQL / GraphiQL to function though, even if you don't have access to `items`
            // (you could still have access to auth/server/etc)
            try {
                collectionsInSystem = yield this.collectionsService.readByQuery();
            }
            catch (_a) {
                collectionsInSystem = [];
            }
            const fieldsInSystem = yield this.fieldsService.readAll();
            const relationsInSystem = (yield this.relationsService.readByQuery({ limit: -1 }));
            const schema = this.getGraphQLSchema(collectionsInSystem, fieldsInSystem, relationsInSystem);
            return schema;
        });
    }
    getGraphQLSchema(collections, fields, relations) {
        var _a, _b;
        const filterTypes = this.getFilterArgs(collections, fields, relations);
        const schema = { items: {} };
        for (const collection of collections) {
            const systemCollection = collection.collection.startsWith('directus_');
            const schemaSection = {
                type: new graphql_1.GraphQLObjectType({
                    name: collection.collection,
                    description: (_a = collection.meta) === null || _a === void 0 ? void 0 : _a.note,
                    fields: () => {
                        var _a, _b;
                        const fieldsObject = {};
                        const fieldsInCollection = fields.filter((field) => field.collection === collection.collection);
                        for (const field of fieldsInCollection) {
                            if (field.field.startsWith('__')) {
                                logger_1.default.warn(`GraphQL doesn't allow fields starting with "__". Field "${field.field}" in collection "${field.collection}" is unavailable in the GraphQL endpoint.`);
                                continue;
                            }
                            const relationForField = relations.find((relation) => {
                                return ((relation.many_collection === collection.collection && relation.many_field === field.field) ||
                                    (relation.one_collection === collection.collection && relation.one_field === field.field));
                            });
                            if (relationForField) {
                                const relationType = get_relation_type_1.getRelationType({
                                    relation: relationForField,
                                    collection: collection.collection,
                                    field: field.field,
                                });
                                if (relationType === 'm2o') {
                                    const relatedIsSystem = relationForField.one_collection.startsWith('directus_');
                                    const relatedType = relatedIsSystem
                                        ? schema[relationForField.one_collection.substring(9)].type
                                        : schema.items[relationForField.one_collection].type;
                                    fieldsObject[field.field] = {
                                        type: relatedType,
                                    };
                                }
                                else if (relationType === 'o2m') {
                                    const relatedIsSystem = relationForField.many_collection.startsWith('directus_');
                                    const relatedType = relatedIsSystem
                                        ? schema[relationForField.many_collection.substring(9)].type
                                        : schema.items[relationForField.many_collection].type;
                                    fieldsObject[field.field] = {
                                        type: new graphql_1.GraphQLList(relatedType),
                                        args: Object.assign(Object.assign({}, this.args), { filter: {
                                                type: filterTypes[relationForField.many_collection],
                                            } }),
                                    };
                                }
                                else if (relationType === 'm2a') {
                                    const relatedCollections = relationForField.one_allowed_collections;
                                    const types = [];
                                    for (const relatedCollection of relatedCollections) {
                                        const relatedType = relatedCollection.startsWith('directus_')
                                            ? schema[relatedCollection.substring(9)].type
                                            : schema.items[relatedCollection].type;
                                        types.push(relatedType);
                                    }
                                    fieldsObject[field.field] = {
                                        type: new graphql_1.GraphQLUnionType({
                                            name: field.collection + '__' + field.field,
                                            types,
                                            resolveType(value, context, info) {
                                                let path = [];
                                                let currentPath = info.path;
                                                while (currentPath.prev) {
                                                    path.push(currentPath.key);
                                                    currentPath = currentPath.prev;
                                                }
                                                path = path.reverse().slice(1, -1);
                                                let parent = context.data;
                                                for (const pathPart of path) {
                                                    parent = parent[pathPart];
                                                }
                                                const type = parent[relationForField.one_collection_field];
                                                return types.find((GraphQLType) => GraphQLType.name === type);
                                            },
                                        }),
                                    };
                                }
                            }
                            else {
                                fieldsObject[field.field] = {
                                    type: ((_a = field.schema) === null || _a === void 0 ? void 0 : _a.is_primary_key) ? graphql_1.GraphQLID : get_graphql_type_1.getGraphQLType(field.type),
                                };
                            }
                            fieldsObject[field.field].description = (_b = field.meta) === null || _b === void 0 ? void 0 : _b.note;
                        }
                        return fieldsObject;
                    },
                }),
                resolve: (source, args, context, info) => __awaiter(this, void 0, void 0, function* () {
                    const data = yield this.resolve(info);
                    context.data = data;
                    return data;
                }),
                args: Object.assign(Object.assign({}, this.args), { filter: {
                        name: `${collection.collection}_filter`,
                        type: filterTypes[collection.collection],
                    } }),
            };
            if (systemCollection) {
                schema[collection.collection.substring(9)] = schemaSection;
            }
            else {
                schema.items[collection.collection] = schemaSection;
            }
        }
        const schemaWithLists = lodash_1.cloneDeep(schema);
        for (const collection of collections) {
            if (((_b = collection.meta) === null || _b === void 0 ? void 0 : _b.singleton) !== true) {
                const systemCollection = collection.collection.startsWith('directus_');
                if (systemCollection) {
                    schemaWithLists[collection.collection.substring(9)].type = new graphql_1.GraphQLList(schemaWithLists[collection.collection.substring(9)].type);
                }
                else {
                    schemaWithLists.items[collection.collection].type = new graphql_1.GraphQLList(schemaWithLists.items[collection.collection].type);
                }
            }
        }
        const queryBase = {
            name: 'Query',
            fields: {
                server: {
                    type: new graphql_1.GraphQLObjectType({
                        name: 'server',
                        fields: {
                            ping: {
                                type: graphql_1.GraphQLString,
                                resolve: () => 'pong',
                            },
                        },
                    }),
                    resolve: () => ({}),
                },
            },
        };
        if (Object.keys(schemaWithLists).length > 0) {
            for (const key of Object.keys(schemaWithLists)) {
                if (key !== 'items') {
                    queryBase.fields[key] = schemaWithLists[key];
                }
            }
        }
        if (Object.keys(schemaWithLists.items).length > 0) {
            queryBase.fields.items = {
                type: new graphql_1.GraphQLObjectType({
                    name: 'items',
                    fields: schemaWithLists.items,
                }),
                resolve: () => ({}),
            };
        }
        return new graphql_1.GraphQLSchema({
            query: new graphql_1.GraphQLObjectType(queryBase),
        });
    }
    getFilterArgs(collections, fields, relations) {
        const filterTypes = {};
        for (const collection of collections) {
            filterTypes[collection.collection] = new graphql_1.GraphQLInputObjectType({
                name: `${collection.collection}_filter`,
                fields: () => {
                    var _a;
                    const filterFields = {
                        _and: {
                            type: new graphql_1.GraphQLList(filterTypes[collection.collection]),
                        },
                        _or: {
                            type: new graphql_1.GraphQLList(filterTypes[collection.collection]),
                        },
                    };
                    const fieldsInCollection = fields.filter((field) => field.collection === collection.collection);
                    for (const field of fieldsInCollection) {
                        if (field.field.startsWith('__'))
                            continue;
                        const relationForField = relations.find((relation) => {
                            return ((relation.many_collection === collection.collection && relation.many_field === field.field) ||
                                (relation.one_collection === collection.collection && relation.one_field === field.field));
                        });
                        if (relationForField) {
                            const relationType = get_relation_type_1.getRelationType({
                                relation: relationForField,
                                collection: collection.collection,
                                field: field.field,
                            });
                            if (relationType === 'm2o') {
                                const relatedType = filterTypes[relationForField.one_collection];
                                filterFields[field.field] = {
                                    type: relatedType,
                                };
                            }
                            else if (relationType === 'o2m') {
                                const relatedType = filterTypes[relationForField.many_collection];
                                filterFields[field.field] = {
                                    type: relatedType,
                                };
                            }
                            /** @TODO M2A — Handle m2a case here */
                            /** @TODO
                             * Figure out how to setup filter fields for a union type output
                             */
                        }
                        else {
                            const fieldType = ((_a = field.schema) === null || _a === void 0 ? void 0 : _a.is_primary_key) ? graphql_1.GraphQLID : get_graphql_type_1.getGraphQLType(field.type);
                            filterFields[field.field] = {
                                type: new graphql_1.GraphQLInputObjectType({
                                    name: `${collection.collection}_${field.field}_filter_operators`,
                                    fields: {
                                        /* @todo make this a little smarter by only including filters that work with current type */
                                        _eq: {
                                            type: fieldType,
                                        },
                                        _neq: {
                                            type: fieldType,
                                        },
                                        _contains: {
                                            type: fieldType,
                                        },
                                        _ncontains: {
                                            type: fieldType,
                                        },
                                        _in: {
                                            type: new graphql_1.GraphQLList(fieldType),
                                        },
                                        _nin: {
                                            type: new graphql_1.GraphQLList(fieldType),
                                        },
                                        _gt: {
                                            type: fieldType,
                                        },
                                        _gte: {
                                            type: fieldType,
                                        },
                                        _lt: {
                                            type: fieldType,
                                        },
                                        _lte: {
                                            type: fieldType,
                                        },
                                        _null: {
                                            type: graphql_1.GraphQLBoolean,
                                        },
                                        _nnull: {
                                            type: graphql_1.GraphQLBoolean,
                                        },
                                        _empty: {
                                            type: graphql_1.GraphQLBoolean,
                                        },
                                        _nempty: {
                                            type: graphql_1.GraphQLBoolean,
                                        },
                                    },
                                }),
                            };
                        }
                    }
                    return filterFields;
                },
            });
        }
        return filterTypes;
    }
    resolve(info) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const systemField = ((_a = info.path.prev) === null || _a === void 0 ? void 0 : _a.key) !== 'items';
            const collection = systemField ? `directus_${info.fieldName}` : info.fieldName;
            const selections = (_c = (_b = info.fieldNodes[0]) === null || _b === void 0 ? void 0 : _b.selectionSet) === null || _c === void 0 ? void 0 : _c.selections;
            if (!selections)
                return null;
            return yield this.getData(collection, selections, info.fieldNodes[0].arguments || [], info.variableValues);
        });
    }
    getData(collection, selections, argsArray, variableValues) {
        return __awaiter(this, void 0, void 0, function* () {
            const args = this.parseArgs(argsArray, variableValues);
            const query = sanitize_query_1.sanitizeQuery(args, this.accountability);
            const parseFields = (selections, parent) => {
                const fields = [];
                for (let selection of selections) {
                    if ((selection.kind === 'Field' || selection.kind === 'InlineFragment') !== true)
                        continue;
                    selection = selection;
                    let current;
                    if (selection.kind === 'InlineFragment') {
                        // filter out graphql pointers, like __typename
                        if (selection.typeCondition.name.value.startsWith('__'))
                            continue;
                        current = `${parent}:${selection.typeCondition.name.value}`;
                    }
                    else {
                        // filter out graphql pointers, like __typename
                        if (selection.name.value.startsWith('__'))
                            continue;
                        current = selection.name.value;
                        if (parent) {
                            current = `${parent}.${current}`;
                        }
                    }
                    if (selection.selectionSet) {
                        const children = parseFields(selection.selectionSet.selections, current);
                        fields.push(...children);
                    }
                    else {
                        fields.push(current);
                    }
                    if (selection.kind === 'Field' && selection.arguments && selection.arguments.length > 0) {
                        if (selection.arguments && selection.arguments.length > 0) {
                            if (!query.deep)
                                query.deep = {};
                            const args = this.parseArgs(selection.arguments, variableValues);
                            lodash_1.set(query.deep, current, lodash_1.merge(lodash_1.get(query.deep, current), lodash_1.mapKeys(sanitize_query_1.sanitizeQuery(args, this.accountability), (value, key) => `_${key}`)));
                        }
                    }
                }
                return fields;
            };
            query.fields = parseFields(selections);
            let service;
            switch (collection) {
                case 'directus_activity':
                    service = new activity_1.ActivityService({
                        knex: this.knex,
                        accountability: this.accountability,
                        schema: this.schema,
                    });
                // case 'directus_collections':
                // 	service = new CollectionsService({ knex: this.knex, accountability: this.accountability });
                // case 'directus_fields':
                // 	service = new FieldsService({ knex: this.knex, accountability: this.accountability });
                case 'directus_files':
                    service = new files_1.FilesService({
                        knex: this.knex,
                        accountability: this.accountability,
                        schema: this.schema,
                    });
                case 'directus_folders':
                    service = new folders_1.FoldersService({
                        knex: this.knex,
                        accountability: this.accountability,
                        schema: this.schema,
                    });
                case 'directus_folders':
                    service = new folders_1.FoldersService({
                        knex: this.knex,
                        accountability: this.accountability,
                        schema: this.schema,
                    });
                case 'directus_permissions':
                    service = new permissions_1.PermissionsService({
                        knex: this.knex,
                        accountability: this.accountability,
                        schema: this.schema,
                    });
                case 'directus_presets':
                    service = new presets_1.PresetsService({
                        knex: this.knex,
                        accountability: this.accountability,
                        schema: this.schema,
                    });
                case 'directus_relations':
                    service = new relations_1.RelationsService({
                        knex: this.knex,
                        accountability: this.accountability,
                        schema: this.schema,
                    });
                case 'directus_revisions':
                    service = new revisions_1.RevisionsService({
                        knex: this.knex,
                        accountability: this.accountability,
                        schema: this.schema,
                    });
                case 'directus_roles':
                    service = new roles_1.RolesService({
                        knex: this.knex,
                        accountability: this.accountability,
                        schema: this.schema,
                    });
                case 'directus_settings':
                    service = new settings_1.SettingsService({
                        knex: this.knex,
                        accountability: this.accountability,
                        schema: this.schema,
                    });
                case 'directus_users':
                    service = new users_1.UsersService({
                        knex: this.knex,
                        accountability: this.accountability,
                        schema: this.schema,
                    });
                case 'directus_webhooks':
                    service = new webhooks_1.WebhooksService({
                        knex: this.knex,
                        accountability: this.accountability,
                        schema: this.schema,
                    });
                default:
                    service = new items_1.ItemsService(collection, {
                        knex: this.knex,
                        accountability: this.accountability,
                        schema: this.schema,
                    });
            }
            const collectionInfo = (yield this.knex.select('singleton').from('directus_collections').where({ collection: collection }).first()) ||
                collections_2.systemCollectionRows.find((collectionMeta) => (collectionMeta === null || collectionMeta === void 0 ? void 0 : collectionMeta.collection) === collection);
            const result = (collectionInfo === null || collectionInfo === void 0 ? void 0 : collectionInfo.singleton)
                ? yield service.readSingleton(query, { stripNonRequested: false })
                : yield service.readByQuery(query, { stripNonRequested: false });
            return result;
        });
    }
    parseArgs(args, variableValues) {
        if (!args || args.length === 0)
            return {};
        const parseObjectValue = (arg) => {
            return this.parseArgs(arg.fields, variableValues);
        };
        const argsObject = {};
        for (const argument of args) {
            if (argument.value.kind === 'ObjectValue') {
                argsObject[argument.name.value] = parseObjectValue(argument.value);
            }
            else if (argument.value.kind === 'Variable') {
                argsObject[argument.name.value] = variableValues[argument.value.name.value];
            }
            else if (argument.value.kind === 'ListValue') {
                const values = [];
                for (const valueNode of argument.value.values) {
                    if (valueNode.kind === 'ObjectValue') {
                        values.push(this.parseArgs(valueNode.fields, variableValues));
                    }
                    else {
                        values.push(valueNode.value);
                    }
                }
                argsObject[argument.name.value] = values;
            }
            else {
                argsObject[argument.name.value] = argument.value.value;
            }
        }
        return argsObject;
    }
}
exports.GraphQLService = GraphQLService;
