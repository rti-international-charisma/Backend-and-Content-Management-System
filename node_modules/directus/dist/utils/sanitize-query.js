"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeQuery = void 0;
const types_1 = require("../types");
const logger_1 = __importDefault(require("../logger"));
const parse_filter_1 = require("../utils/parse-filter");
const lodash_1 = require("lodash");
function sanitizeQuery(rawQuery, accountability) {
    const query = {};
    if (rawQuery.limit !== undefined) {
        const limit = sanitizeLimit(rawQuery.limit);
        if (typeof limit === 'number') {
            query.limit = limit;
        }
    }
    if (rawQuery.fields) {
        query.fields = sanitizeFields(rawQuery.fields);
    }
    if (rawQuery.sort) {
        query.sort = sanitizeSort(rawQuery.sort);
    }
    if (rawQuery.filter) {
        query.filter = sanitizeFilter(rawQuery.filter, accountability || null);
    }
    if (rawQuery.offset) {
        query.offset = sanitizeOffset(rawQuery.offset);
    }
    if (rawQuery.page) {
        query.page = sanitizePage(rawQuery.page);
    }
    if (rawQuery.single || rawQuery.single === '') {
        query.single = sanitizeSingle(rawQuery.single);
    }
    if (rawQuery.meta) {
        query.meta = sanitizeMeta(rawQuery.meta);
    }
    if (rawQuery.search && typeof rawQuery.search === 'string') {
        query.search = rawQuery.search;
    }
    if (rawQuery.export) {
        query.export = rawQuery.export;
    }
    if (rawQuery.deep) {
        if (!query.deep)
            query.deep = {};
        query.deep = sanitizeDeep(rawQuery.deep, accountability);
    }
    return query;
}
exports.sanitizeQuery = sanitizeQuery;
function sanitizeFields(rawFields) {
    if (!rawFields)
        return;
    let fields = [];
    if (typeof rawFields === 'string')
        fields = rawFields.split(',');
    else if (Array.isArray(rawFields))
        fields = rawFields;
    // Case where array item includes CSV (fe fields[]=id,name):
    fields = lodash_1.flatten(fields.map((field) => (field.includes(',') ? field.split(',') : field)));
    fields = fields.map((field) => field.trim());
    return fields;
}
function sanitizeSort(rawSort) {
    let fields = [];
    if (typeof rawSort === 'string')
        fields = rawSort.split(',');
    else if (Array.isArray(rawSort))
        fields = rawSort;
    return fields.map((field) => {
        const order = field.startsWith('-') ? 'desc' : 'asc';
        const column = field.startsWith('-') ? field.substring(1) : field;
        return { column, order };
    });
}
function sanitizeFilter(rawFilter, accountability) {
    let filters = rawFilter;
    if (typeof rawFilter === 'string') {
        try {
            filters = JSON.parse(rawFilter);
        }
        catch (_a) {
            logger_1.default.warn('Invalid value passed for filter query parameter.');
        }
    }
    filters = parse_filter_1.parseFilter(filters, accountability);
    return filters;
}
function sanitizeLimit(rawLimit) {
    if (rawLimit === undefined || rawLimit === null)
        return null;
    return Number(rawLimit);
}
function sanitizeOffset(rawOffset) {
    return Number(rawOffset);
}
function sanitizePage(rawPage) {
    return Number(rawPage);
}
function sanitizeSingle(rawSingle) {
    if (rawSingle !== undefined && rawSingle !== null && ['', 'true', 1, '1'].includes(rawSingle)) {
        return true;
    }
    return false;
}
function sanitizeMeta(rawMeta) {
    if (rawMeta === '*') {
        return Object.values(types_1.Meta);
    }
    if (rawMeta.includes(',')) {
        return rawMeta.split(',');
    }
    if (Array.isArray(rawMeta)) {
        return rawMeta;
    }
    return [rawMeta];
}
function sanitizeDeep(deep, accountability) {
    const result = {};
    if (typeof deep === 'string') {
        try {
            deep = JSON.parse(deep);
        }
        catch (_a) {
            logger_1.default.warn('Invalid value passed for deep query parameter.');
        }
    }
    parse(deep);
    return result;
    function parse(level, path = []) {
        const parsedLevel = {};
        for (const [key, value] of Object.entries(level)) {
            if (!key)
                break;
            if (key.startsWith('_')) {
                // Sanitize query only accepts non-underscore-prefixed query options
                const parsedSubQuery = sanitizeQuery({ [key.substring(1)]: value }, accountability);
                // ...however we want to keep them for the nested structure of deep, otherwise there's no
                // way of knowing when to keep nesting and when to stop
                parsedLevel[key] = Object.values(parsedSubQuery)[0];
            }
            else {
                parse(value, [...path, key]);
            }
        }
        if (Object.keys(parsedLevel).length > 0) {
            lodash_1.set(result, path, lodash_1.merge({}, lodash_1.get(result, path, {}), parsedLevel));
        }
    }
}
