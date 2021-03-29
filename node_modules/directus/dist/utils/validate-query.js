"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQuery = void 0;
const joi_1 = __importDefault(require("joi"));
const exceptions_1 = require("../exceptions");
const lodash_1 = require("lodash");
const querySchema = joi_1.default.object({
    fields: joi_1.default.array().items(joi_1.default.string()),
    sort: joi_1.default.array().items(joi_1.default.object({
        column: joi_1.default.string(),
        order: joi_1.default.string().valid('asc', 'desc'),
    })),
    filter: joi_1.default.object({}).unknown(),
    limit: joi_1.default.number(),
    offset: joi_1.default.number(),
    page: joi_1.default.number(),
    single: joi_1.default.boolean(),
    meta: joi_1.default.array().items(joi_1.default.string().valid('total_count', 'filter_count')),
    search: joi_1.default.string(),
    export: joi_1.default.string().valid('json', 'csv'),
    deep: joi_1.default.object(),
}).id('query');
function validateQuery(query) {
    const { error } = querySchema.validate(query);
    if (query.filter && Object.keys(query.filter).length > 0) {
        validateFilter(query.filter);
    }
    if (error) {
        throw new exceptions_1.InvalidQueryException(error.message);
    }
    return query;
}
exports.validateQuery = validateQuery;
function validateFilter(filter) {
    if (!filter)
        throw new exceptions_1.InvalidQueryException('Invalid filter object');
    for (let [key, nested] of Object.entries(filter)) {
        if (key === '_and' || key === '_or') {
            nested.forEach(validateFilter);
        }
        else if (lodash_1.isPlainObject(nested)) {
            validateFilter(nested);
        }
        else if (key.startsWith('_')) {
            const value = nested;
            switch (key) {
                case '_eq':
                case '_neq':
                case '_contains':
                case '_ncontains':
                case '_gt':
                case '_gte':
                case '_lt':
                case '_lte':
                default:
                    validateFilterPrimitive(value, key);
                    break;
                case '_in':
                case '_nin':
                case '_between':
                case '_nbetween':
                    validateList(value, key);
                    break;
                case '_null':
                case '_nnull':
                case '_empty':
                case '_nempty':
                    validateBoolean(value, key);
                    break;
            }
        }
        else if (lodash_1.isPlainObject(nested) === false && Array.isArray(nested) === false) {
            validateFilterPrimitive(nested, '_eq');
        }
        else {
            validateFilter(nested);
        }
    }
}
function validateFilterPrimitive(value, key) {
    if (value === null)
        return true;
    if ((typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value instanceof Date) ===
        false) {
        throw new exceptions_1.InvalidQueryException(`The filter value for "${key}" has to be a string, number, or boolean`);
    }
    if (typeof value === 'number' && Number.isNaN(value)) {
        throw new exceptions_1.InvalidQueryException(`The filter value for "${key}" is not a valid number`);
    }
    if (typeof value === 'string' && value.length === 0) {
        throw new exceptions_1.InvalidQueryException(`You can't filter for an empty string in "${key}". Use "_empty" or "_nempty" instead`);
    }
    return true;
}
function validateList(value, key) {
    if (Array.isArray(value) === false || value.length === 0) {
        throw new exceptions_1.InvalidQueryException(`"${key}" has to be an array of values`);
    }
    return true;
}
function validateBoolean(value, key) {
    if (typeof value !== 'boolean') {
        throw new exceptions_1.InvalidQueryException(`"${key}" has to be a boolean`);
    }
    return true;
}
