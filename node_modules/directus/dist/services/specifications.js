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
exports.SpecificationService = void 0;
const collections_1 = require("./collections");
const fields_1 = require("./fields");
const format_title_1 = __importDefault(require("@directus/format-title"));
const lodash_1 = require("lodash");
const relations_1 = require("./relations");
const env_1 = __importDefault(require("../env"));
// @ts-ignore
const package_json_1 = require("../../package.json");
const specs_1 = __importDefault(require("@directus/specs"));
const database_1 = __importDefault(require("../database"));
const get_relation_type_1 = require("../utils/get-relation-type");
class SpecificationService {
    constructor(options) {
        this.accountability = options.accountability || null;
        this.knex = options.knex || database_1.default;
        this.schema = options.schema;
        this.fieldsService = new fields_1.FieldsService(options);
        this.collectionsService = new collections_1.CollectionsService(options);
        this.relationsService = new relations_1.RelationsService(options);
        this.oas = new OASService({ knex: this.knex, accountability: this.accountability, schema: this.schema }, {
            fieldsService: this.fieldsService,
            collectionsService: this.collectionsService,
            relationsService: this.relationsService,
        });
    }
}
exports.SpecificationService = SpecificationService;
class OASService {
    constructor(options, { fieldsService, collectionsService, relationsService, }) {
        this.fieldTypes = {
            bigInteger: {
                type: 'integer',
                format: 'int64',
            },
            boolean: {
                type: 'boolean',
            },
            date: {
                type: 'string',
                format: 'date',
            },
            dateTime: {
                type: 'string',
                format: 'date-time',
            },
            decimal: {
                type: 'number',
            },
            float: {
                type: 'number',
                format: 'float',
            },
            integer: {
                type: 'integer',
            },
            json: {
                type: 'array',
                items: {
                    type: 'string',
                },
            },
            string: {
                type: 'string',
            },
            text: {
                type: 'string',
            },
            time: {
                type: 'string',
                format: 'time',
            },
            timestamp: {
                type: 'string',
                format: 'timestamp',
            },
            binary: {
                type: 'string',
                format: 'binary',
            },
            uuid: {
                type: 'string',
                format: 'uuid',
            },
            csv: {
                type: 'array',
                items: {
                    type: 'string',
                },
            },
            hash: {
                type: 'string',
            },
        };
        this.accountability = options.accountability || null;
        this.knex = options.knex || database_1.default;
        this.schema = options.schema;
        this.fieldsService = fieldsService;
        this.collectionsService = collectionsService;
        this.relationsService = relationsService;
    }
    generate() {
        return __awaiter(this, void 0, void 0, function* () {
            const collections = yield this.collectionsService.readByQuery();
            const fields = yield this.fieldsService.readAll();
            const relations = (yield this.relationsService.readByQuery({}));
            const permissions = this.schema.permissions;
            const tags = yield this.generateTags(collections);
            const paths = yield this.generatePaths(permissions, tags);
            const components = yield this.generateComponents(collections, fields, relations, tags);
            const spec = {
                openapi: '3.0.1',
                info: {
                    title: 'Dynamic API Specification',
                    description: 'This is a dynamically generated API specification for all endpoints existing on the current project.',
                    version: package_json_1.version,
                },
                servers: [
                    {
                        url: env_1.default.PUBLIC_URL,
                        description: 'Your current Directus instance.',
                    },
                ],
                tags,
                paths,
                components,
            };
            return spec;
        });
    }
    generateTags(collections) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const systemTags = lodash_1.cloneDeep(specs_1.default.tags);
            const tags = [];
            // System tags that don't have an associated collection are always readable to the user
            for (const systemTag of systemTags) {
                if (!systemTag['x-collection']) {
                    tags.push(systemTag);
                }
            }
            for (const collection of collections) {
                const isSystem = collection.collection.startsWith('directus_');
                // If the collection is one of the system collections, pull the tag from the static spec
                if (isSystem) {
                    for (const tag of specs_1.default.tags) {
                        if (tag['x-collection'] === collection.collection) {
                            tags.push(tag);
                            break;
                        }
                    }
                }
                else {
                    tags.push({
                        name: 'Items' + format_title_1.default(collection.collection).replace(/ /g, ''),
                        description: ((_a = collection.meta) === null || _a === void 0 ? void 0 : _a.note) || undefined,
                        'x-collection': collection.collection,
                    });
                }
            }
            // Filter out the generic Items information
            return tags.filter((tag) => tag.name !== 'Items');
        });
    }
    generatePaths(permissions, tags) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const paths = {};
            if (!tags)
                return paths;
            for (const tag of tags) {
                const isSystem = tag.hasOwnProperty('x-collection') === false || tag['x-collection'].startsWith('directus_');
                if (isSystem) {
                    for (const [path, pathItem] of Object.entries(specs_1.default.paths)) {
                        for (const [method, operation] of Object.entries(pathItem)) {
                            if ((_a = operation.tags) === null || _a === void 0 ? void 0 : _a.includes(tag.name)) {
                                if (!paths[path]) {
                                    paths[path] = {};
                                }
                                const hasPermission = ((_b = this.accountability) === null || _b === void 0 ? void 0 : _b.admin) === true ||
                                    tag.hasOwnProperty('x-collection') === false ||
                                    !!permissions.find((permission) => permission.collection === tag['x-collection'] &&
                                        permission.action === this.getActionForMethod(method));
                                if (hasPermission) {
                                    paths[path][method] = operation;
                                }
                            }
                        }
                    }
                }
                else {
                    const listBase = lodash_1.cloneDeep(specs_1.default.paths['/items/{collection}']);
                    const detailBase = lodash_1.cloneDeep(specs_1.default.paths['/items/{collection}/{id}']);
                    const collection = tag['x-collection'];
                    for (const method of ['post', 'get', 'patch', 'delete']) {
                        const hasPermission = ((_c = this.accountability) === null || _c === void 0 ? void 0 : _c.admin) === true ||
                            !!permissions.find((permission) => permission.collection === collection && permission.action === this.getActionForMethod(method));
                        if (hasPermission) {
                            if (!paths[`/items/${collection}`])
                                paths[`/items/${collection}`] = {};
                            if (!paths[`/items/${collection}/{id}`])
                                paths[`/items/${collection}/{id}`] = {};
                            if (listBase[method]) {
                                paths[`/items/${collection}`][method] = lodash_1.mergeWith(lodash_1.cloneDeep(listBase[method]), {
                                    description: listBase[method].description.replace('item', collection + ' item'),
                                    tags: [tag.name],
                                    operationId: `${this.getActionForMethod(method)}${tag.name}`,
                                    requestBody: ['get', 'delete'].includes(method)
                                        ? undefined
                                        : {
                                            content: {
                                                'application/json': {
                                                    schema: {
                                                        oneOf: [
                                                            {
                                                                type: 'array',
                                                                items: {
                                                                    $ref: `#/components/schema/${tag.name}`,
                                                                },
                                                            },
                                                            {
                                                                $ref: `#/components/schema/${tag.name}`,
                                                            },
                                                        ],
                                                    },
                                                },
                                            },
                                        },
                                    responses: {
                                        '200': {
                                            content: method === 'delete'
                                                ? undefined
                                                : {
                                                    'application/json': {
                                                        schema: {
                                                            properties: {
                                                                data: {
                                                                    items: {
                                                                        $ref: `#/components/schema/${tag.name}`,
                                                                    },
                                                                },
                                                            },
                                                        },
                                                    },
                                                },
                                        },
                                    },
                                }, (obj, src) => {
                                    if (Array.isArray(obj))
                                        return obj.concat(src);
                                });
                            }
                            if (detailBase[method]) {
                                paths[`/items/${collection}/{id}`][method] = lodash_1.mergeWith(lodash_1.cloneDeep(detailBase[method]), {
                                    description: detailBase[method].description.replace('item', collection + ' item'),
                                    tags: [tag.name],
                                    operationId: `${this.getActionForMethod(method)}Single${tag.name}`,
                                    requestBody: ['get', 'delete'].includes(method)
                                        ? undefined
                                        : {
                                            content: {
                                                'application/json': {
                                                    schema: {
                                                        $ref: `#/components/schema/${tag.name}`,
                                                    },
                                                },
                                            },
                                        },
                                    responses: {
                                        '200': {
                                            content: method === 'delete'
                                                ? undefined
                                                : {
                                                    'application/json': {
                                                        schema: {
                                                            properties: {
                                                                data: {
                                                                    items: {
                                                                        $ref: `#/components/schema/${tag.name}`,
                                                                    },
                                                                },
                                                            },
                                                        },
                                                    },
                                                },
                                        },
                                    },
                                }, (obj, src) => {
                                    if (Array.isArray(obj))
                                        return obj.concat(src);
                                });
                            }
                        }
                    }
                }
            }
            return paths;
        });
    }
    generateComponents(collections, fields, relations, tags) {
        return __awaiter(this, void 0, void 0, function* () {
            let components = lodash_1.cloneDeep(specs_1.default.components);
            if (!components)
                components = {};
            components.schemas = {};
            if (!tags)
                return;
            for (const collection of collections) {
                const tag = tags.find((tag) => tag['x-collection'] === collection.collection);
                if (!tag)
                    continue;
                const isSystem = collection.collection.startsWith('directus_');
                const fieldsInCollection = fields.filter((field) => field.collection === collection.collection);
                if (isSystem) {
                    const schemaComponent = lodash_1.cloneDeep(specs_1.default.components.schemas[tag.name]);
                    schemaComponent.properties = {};
                    for (const field of fieldsInCollection) {
                        schemaComponent.properties[field.field] =
                            lodash_1.cloneDeep(specs_1.default.components.schemas[tag.name].properties[field.field]) || this.generateField(field, relations, tags, fields);
                    }
                    components.schemas[tag.name] = schemaComponent;
                }
                else {
                    const schemaComponent = {
                        type: 'object',
                        properties: {},
                        'x-collection': collection.collection,
                    };
                    for (const field of fieldsInCollection) {
                        schemaComponent.properties[field.field] = this.generateField(field, relations, tags, fields);
                    }
                    components.schemas[tag.name] = schemaComponent;
                }
            }
            return components;
        });
    }
    getActionForMethod(method) {
        switch (method) {
            case 'post':
                return 'create';
            case 'patch':
                return 'update';
            case 'delete':
                return 'delete';
            case 'get':
            default:
                return 'read';
        }
    }
    generateField(field, relations, tags, fields) {
        var _a, _b;
        let propertyObject = {
            nullable: (_a = field.schema) === null || _a === void 0 ? void 0 : _a.is_nullable,
            description: ((_b = field.meta) === null || _b === void 0 ? void 0 : _b.note) || undefined,
        };
        const relation = relations.find((relation) => (relation.many_collection === field.collection && relation.many_field === field.field) ||
            (relation.one_collection === field.collection && relation.one_field === field.field));
        if (!relation) {
            propertyObject = Object.assign(Object.assign({}, propertyObject), this.fieldTypes[field.type]);
        }
        else {
            const relationType = get_relation_type_1.getRelationType({
                relation,
                field: field.field,
                collection: field.collection,
            });
            if (relationType === 'm2o') {
                const relatedTag = tags.find((tag) => tag['x-collection'] === relation.one_collection);
                const relatedPrimaryKeyField = fields.find((field) => { var _a; return field.collection === relation.one_collection && ((_a = field.schema) === null || _a === void 0 ? void 0 : _a.is_primary_key); });
                if (!relatedTag || !relatedPrimaryKeyField)
                    return propertyObject;
                propertyObject.oneOf = [
                    Object.assign({}, this.fieldTypes[relatedPrimaryKeyField.type]),
                    {
                        $ref: `#/components/schemas/${relatedTag.name}`,
                    },
                ];
            }
            else if (relationType === 'o2m') {
                const relatedTag = tags.find((tag) => tag['x-collection'] === relation.many_collection);
                const relatedPrimaryKeyField = fields.find((field) => { var _a; return field.collection === relation.many_collection && ((_a = field.schema) === null || _a === void 0 ? void 0 : _a.is_primary_key); });
                if (!relatedTag || !relatedPrimaryKeyField)
                    return propertyObject;
                propertyObject.type = 'array';
                propertyObject.items = {
                    oneOf: [
                        Object.assign({}, this.fieldTypes[relatedPrimaryKeyField.type]),
                        {
                            $ref: `#/components/schemas/${relatedTag.name}`,
                        },
                    ],
                };
            }
            else if (relationType === 'm2a') {
                const relatedTags = tags.filter((tag) => relation.one_allowed_collections.includes(tag['x-collection']));
                propertyObject.type = 'array';
                propertyObject.items = {
                    oneOf: [
                        {
                            type: 'string',
                        },
                        relatedTags.map((tag) => ({
                            $ref: `#/components/schemas/${tag.name}`,
                        })),
                    ],
                };
            }
        }
        return propertyObject;
    }
}
