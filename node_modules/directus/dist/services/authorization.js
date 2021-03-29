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
exports.AuthorizationService = void 0;
const database_1 = __importDefault(require("../database"));
const exceptions_1 = require("../exceptions");
const lodash_1 = require("lodash");
const generate_joi_1 = __importDefault(require("../utils/generate-joi"));
const items_1 = require("./items");
const payload_1 = require("./payload");
const parse_filter_1 = require("../utils/parse-filter");
const to_array_1 = require("../utils/to-array");
const fields_1 = require("../database/system-data/fields");
class AuthorizationService {
    constructor(options) {
        this.knex = options.knex || database_1.default;
        this.accountability = options.accountability || null;
        this.schema = options.schema;
        this.payloadService = new payload_1.PayloadService('directus_permissions', {
            knex: this.knex,
            schema: this.schema,
        });
    }
    processAST(ast, action = 'read') {
        return __awaiter(this, void 0, void 0, function* () {
            const collectionsRequested = getCollectionsFromAST(ast);
            let permissionsForCollections = this.schema.permissions.filter((permission) => {
                return (permission.action === action &&
                    collectionsRequested.map(({ collection }) => collection).includes(permission.collection));
            });
            // If the permissions don't match the collections, you don't have permission to read all of them
            const uniqueCollectionsRequestedCount = lodash_1.uniq(collectionsRequested.map(({ collection }) => collection)).length;
            if (uniqueCollectionsRequestedCount !== permissionsForCollections.length) {
                // Find the first collection that doesn't have permissions configured
                const { collection, field } = collectionsRequested.find(({ collection }) => permissionsForCollections.find((permission) => permission.collection === collection) === undefined);
                if (field) {
                    throw new exceptions_1.ForbiddenException(`You don't have permission to access the "${field}" field.`);
                }
                else {
                    throw new exceptions_1.ForbiddenException(`You don't have permission to access the "${collection}" collection.`);
                }
            }
            validateFields(ast);
            applyFilters(ast, this.accountability);
            return ast;
            /**
             * Traverses the AST and returns an array of all collections that are being fetched
             */
            function getCollectionsFromAST(ast) {
                const collections = [];
                if (ast.type === 'm2a') {
                    collections.push(...ast.names.map((name) => ({ collection: name, field: ast.fieldKey })));
                    /** @TODO add nestedNode */
                }
                else {
                    collections.push({
                        collection: ast.name,
                        field: ast.type === 'root' ? null : ast.fieldKey,
                    });
                    for (const nestedNode of ast.children) {
                        if (nestedNode.type !== 'field') {
                            collections.push(...getCollectionsFromAST(nestedNode));
                        }
                    }
                }
                return collections;
            }
            function validateFields(ast) {
                if (ast.type !== 'field' && ast.type !== 'm2a') {
                    /** @TODO remove m2a check */
                    const collection = ast.name;
                    // We check the availability of the permissions in the step before this is run
                    const permissions = permissionsForCollections.find((permission) => permission.collection === collection);
                    const allowedFields = permissions.fields || [];
                    for (const childNode of ast.children) {
                        if (childNode.type !== 'field') {
                            validateFields(childNode);
                            continue;
                        }
                        if (allowedFields.includes('*'))
                            continue;
                        const fieldKey = childNode.name;
                        if (allowedFields.includes(fieldKey) === false) {
                            throw new exceptions_1.ForbiddenException(`You don't have permission to access the "${fieldKey}" field.`);
                        }
                    }
                }
            }
            function applyFilters(ast, accountability) {
                if (ast.type !== 'field' && ast.type !== 'm2a') {
                    /** @TODO remove m2a check */
                    const collection = ast.name;
                    // We check the availability of the permissions in the step before this is run
                    const permissions = permissionsForCollections.find((permission) => permission.collection === collection);
                    const parsedPermissions = parse_filter_1.parseFilter(permissions.permissions, accountability);
                    if (!ast.query.filter || Object.keys(ast.query.filter).length === 0) {
                        ast.query.filter = { _and: [] };
                    }
                    else {
                        ast.query.filter = { _and: [ast.query.filter] };
                    }
                    if (parsedPermissions && Object.keys(parsedPermissions).length > 0) {
                        ast.query.filter._and.push(parsedPermissions);
                    }
                    if (ast.query.filter._and.length === 0)
                        delete ast.query.filter._and;
                    if (permissions.limit && ast.query.limit && ast.query.limit > permissions.limit) {
                        throw new exceptions_1.ForbiddenException(`You can't read more than ${permissions.limit} items at a time.`);
                    }
                    // Default to the permissions limit if limit hasn't been set
                    if (permissions.limit && !ast.query.limit) {
                        ast.query.limit = permissions.limit;
                    }
                    ast.children = ast.children.map((child) => applyFilters(child, accountability));
                }
                return ast;
            }
        });
    }
    validatePayload(action, collection, payload) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const validationErrors = [];
            let payloads = to_array_1.toArray(payload);
            let permission;
            if (((_a = this.accountability) === null || _a === void 0 ? void 0 : _a.admin) === true) {
                permission = {
                    id: 0,
                    role: (_b = this.accountability) === null || _b === void 0 ? void 0 : _b.role,
                    collection,
                    action,
                    permissions: {},
                    validation: {},
                    limit: null,
                    fields: ['*'],
                    presets: {},
                };
            }
            else {
                permission = this.schema.permissions.find((permission) => {
                    return permission.collection === collection && permission.action === action;
                });
                if (!permission)
                    throw new exceptions_1.ForbiddenException();
                // Check if you have permission to access the fields you're trying to access
                const allowedFields = permission.fields || [];
                if (allowedFields.includes('*') === false) {
                    for (const payload of payloads) {
                        const keysInData = Object.keys(payload);
                        const invalidKeys = keysInData.filter((fieldKey) => allowedFields.includes(fieldKey) === false);
                        if (invalidKeys.length > 0) {
                            throw new exceptions_1.ForbiddenException(`You're not allowed to ${action} field "${invalidKeys[0]}" in collection "${collection}".`);
                        }
                    }
                }
            }
            const preset = parse_filter_1.parseFilter(permission.presets || {}, this.accountability);
            payloads = payloads.map((payload) => lodash_1.merge({}, preset, payload));
            const columns = Object.values(this.schema.tables[collection].columns);
            let requiredColumns = [];
            for (const column of columns) {
                const field = this.schema.fields.find((field) => field.collection === collection && field.field === column.column_name) ||
                    fields_1.systemFieldRows.find((fieldMeta) => fieldMeta.field === column.column_name && fieldMeta.collection === collection);
                const specials = (_c = field === null || field === void 0 ? void 0 : field.special) !== null && _c !== void 0 ? _c : [];
                const hasGenerateSpecial = ['uuid', 'date-created', 'role-created', 'user-created'].some((name) => specials.includes(name));
                const isRequired = column.is_nullable === false && column.default_value === null && hasGenerateSpecial === false;
                if (isRequired) {
                    requiredColumns.push(column.column_name);
                }
            }
            if (requiredColumns.length > 0) {
                permission.validation = {
                    _and: [permission.validation, {}],
                };
                if (action === 'create') {
                    for (const name of requiredColumns) {
                        permission.validation._and[1][name] = {
                            _required: true,
                        };
                    }
                }
                else {
                    for (const name of requiredColumns) {
                        permission.validation._and[1][name] = {
                            _nnull: true,
                        };
                    }
                }
            }
            validationErrors.push(...this.validateJoi(parse_filter_1.parseFilter(permission.validation || {}, this.accountability), payloads));
            if (validationErrors.length > 0)
                throw validationErrors;
            if (Array.isArray(payload)) {
                return payloads;
            }
            else {
                return payloads[0];
            }
        });
    }
    validateJoi(validation, payloads) {
        if (!validation)
            return [];
        const errors = [];
        /**
         * Note there can only be a single _and / _or per level
         */
        if (Object.keys(validation)[0] === '_and') {
            const subValidation = Object.values(validation)[0];
            const nestedErrors = lodash_1.flatten(subValidation.map((subObj) => {
                return this.validateJoi(subObj, payloads);
            })).filter((err) => err);
            errors.push(...nestedErrors);
        }
        else if (Object.keys(validation)[0] === '_or') {
            const subValidation = Object.values(validation)[0];
            const nestedErrors = lodash_1.flatten(subValidation.map((subObj) => this.validateJoi(subObj, payloads)));
            const allErrored = nestedErrors.every((err) => err);
            if (allErrored) {
                errors.push(...nestedErrors);
            }
        }
        else {
            const schema = generate_joi_1.default(validation);
            for (const payload of payloads) {
                const { error } = schema.validate(payload, { abortEarly: false });
                if (error) {
                    errors.push(...error.details.map((details) => new exceptions_1.FailedValidationException(details)));
                }
            }
        }
        return errors;
    }
    checkAccess(action, collection, pk) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (((_a = this.accountability) === null || _a === void 0 ? void 0 : _a.admin) === true)
                return;
            const itemsService = new items_1.ItemsService(collection, {
                accountability: this.accountability,
                knex: this.knex,
                schema: this.schema,
            });
            const query = {
                fields: ['*'],
            };
            const result = yield itemsService.readByKey(pk, query, action);
            if (!result)
                throw new exceptions_1.ForbiddenException();
            if (Array.isArray(pk) && pk.length > 1 && result.length !== pk.length)
                throw new exceptions_1.ForbiddenException();
        });
    }
}
exports.AuthorizationService = AuthorizationService;
