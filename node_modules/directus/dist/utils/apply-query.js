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
exports.applySearch = exports.applyFilter = void 0;
const lodash_1 = require("lodash");
const relations_1 = require("../database/system-data/relations");
const nanoid_1 = require("nanoid");
const get_local_type_1 = __importDefault(require("./get-local-type"));
const uuid_validate_1 = __importDefault(require("uuid-validate"));
const generateAlias = nanoid_1.customAlphabet('abcdefghijklmnopqrstuvwxyz', 5);
function applyQuery(collection, dbQuery, query, schema, subQuery = false) {
    if (query.sort) {
        dbQuery.orderBy(query.sort.map((sort) => (Object.assign(Object.assign({}, sort), { column: `${collection}.${sort.column}` }))));
    }
    if (typeof query.limit === 'number') {
        dbQuery.limit(query.limit);
    }
    if (query.offset) {
        dbQuery.offset(query.offset);
    }
    if (query.page && query.limit) {
        dbQuery.offset(query.limit * (query.page - 1));
    }
    if (query.single) {
        dbQuery.limit(1).first();
    }
    if (query.filter) {
        applyFilter(schema, dbQuery, query.filter, collection, subQuery);
    }
    if (query.search) {
        applySearch(schema, dbQuery, query.search, collection);
    }
}
exports.default = applyQuery;
function applyFilter(schema, rootQuery, rootFilter, collection, subQuery = false) {
    const relations = [...schema.relations, ...relations_1.systemRelationRows];
    const aliasMap = {};
    addJoins(rootQuery, rootFilter, collection);
    addWhereClauses(rootQuery, rootFilter, collection);
    function addJoins(dbQuery, filter, collection) {
        for (const [key, value] of Object.entries(filter)) {
            if (key === '_or' || key === '_and') {
                // If the _or array contains an empty object (full permissions), we should short-circuit and ignore all other
                // permission checks, as {} already matches full permissions.
                if (key === '_or' && value.some((subFilter) => Object.keys(subFilter).length === 0))
                    continue;
                value.forEach((subFilter) => {
                    addJoins(dbQuery, subFilter, collection);
                });
                continue;
            }
            const filterPath = getFilterPath(key, value);
            if (filterPath.length > 1) {
                addJoin(filterPath, collection);
            }
        }
        function addJoin(path, collection) {
            path = lodash_1.clone(path);
            followRelation(path);
            function followRelation(pathParts, parentCollection = collection, parentAlias) {
                const relation = relations.find((relation) => {
                    return ((relation.many_collection === parentCollection && relation.many_field === pathParts[0]) ||
                        (relation.one_collection === parentCollection && relation.one_field === pathParts[0]));
                });
                if (!relation)
                    return;
                const isM2O = relation.many_collection === parentCollection && relation.many_field === pathParts[0];
                const alias = generateAlias();
                lodash_1.set(aliasMap, parentAlias ? [parentAlias, ...pathParts] : pathParts, alias);
                if (isM2O) {
                    dbQuery.leftJoin({ [alias]: relation.one_collection }, `${parentAlias || parentCollection}.${relation.many_field}`, `${alias}.${relation.one_primary}`);
                }
                if (subQuery === true && isM2O === false) {
                    dbQuery.leftJoin({ [alias]: relation.many_collection }, `${parentAlias || parentCollection}.${relation.one_primary}`, `${alias}.${relation.many_field}`);
                }
                if (isM2O || subQuery === true) {
                    pathParts.shift();
                    const parent = isM2O ? relation.one_collection : relation.many_collection;
                    if (pathParts.length) {
                        followRelation(pathParts, parent, alias);
                    }
                }
            }
        }
    }
    function addWhereClauses(dbQuery, filter, collection, logical = 'and') {
        for (const [key, value] of Object.entries(filter)) {
            if (key === '_or' || key === '_and') {
                // If the _or array contains an empty object (full permissions), we should short-circuit and ignore all other
                // permission checks, as {} already matches full permissions.
                if (key === '_or' && value.some((subFilter) => Object.keys(subFilter).length === 0))
                    continue;
                /** @NOTE this callback function isn't called until Knex runs the query */
                dbQuery[logical].where((subQuery) => {
                    value.forEach((subFilter) => {
                        addWhereClauses(subQuery, subFilter, collection, key === '_and' ? 'and' : 'or');
                    });
                });
                continue;
            }
            const filterPath = getFilterPath(key, value);
            const { operator: filterOperator, value: filterValue } = getOperation(key, value);
            const o2mRelation = relations.find((relation) => {
                return relation.one_collection === collection && relation.one_field === filterPath[0];
            });
            if (!!o2mRelation && subQuery === false) {
                const pkField = `${collection}.${o2mRelation.one_primary}`;
                dbQuery[logical].whereIn(pkField, (subQueryKnex) => {
                    subQueryKnex.select([o2mRelation.many_field]).from(o2mRelation.many_collection);
                    applyQuery(o2mRelation.many_collection, subQueryKnex, {
                        filter: value,
                    }, schema, true);
                });
            }
            else {
                if (filterPath.length > 1) {
                    const columnName = getWhereColumn(filterPath, collection);
                    if (!columnName)
                        continue;
                    applyFilterToQuery(columnName, filterOperator, filterValue, logical);
                }
                else {
                    applyFilterToQuery(`${collection}.${filterPath[0]}`, filterOperator, filterValue, logical);
                }
            }
        }
        function applyFilterToQuery(key, operator, compareValue, logical = 'and') {
            if (operator === '_eq') {
                dbQuery[logical].where({ [key]: compareValue });
            }
            if (operator === '_neq') {
                dbQuery[logical].whereNot({ [key]: compareValue });
            }
            if (operator === '_contains') {
                dbQuery[logical].where(key, 'like', `%${compareValue}%`);
            }
            if (operator === '_ncontains') {
                dbQuery[logical].whereNot(key, 'like', `%${compareValue}%`);
            }
            if (operator === '_gt') {
                dbQuery[logical].where(key, '>', compareValue);
            }
            if (operator === '_gte') {
                dbQuery[logical].where(key, '>=', compareValue);
            }
            if (operator === '_lt') {
                dbQuery[logical].where(key, '<', compareValue);
            }
            if (operator === '_lte') {
                dbQuery[logical].where(key, '<=', compareValue);
            }
            if (operator === '_in') {
                let value = compareValue;
                if (typeof value === 'string')
                    value = value.split(',');
                dbQuery[logical].whereIn(key, value);
            }
            if (operator === '_nin') {
                let value = compareValue;
                if (typeof value === 'string')
                    value = value.split(',');
                dbQuery[logical].whereNotIn(key, value);
            }
            if (operator === '_null' || (operator === '_nnull' && compareValue === false)) {
                dbQuery[logical].whereNull(key);
            }
            if (operator === '_nnull' || (operator === '_null' && compareValue === false)) {
                dbQuery[logical].whereNotNull(key);
            }
            if (operator === '_empty' || (operator === '_nempty' && compareValue === false)) {
                dbQuery[logical].andWhere((query) => {
                    query.whereNull(key);
                    query.orWhere(key, '=', '');
                });
            }
            if (operator === '_nempty' || (operator === '_empty' && compareValue === false)) {
                dbQuery[logical].andWhere((query) => {
                    query.whereNotNull(key);
                    query.orWhere(key, '!=', '');
                });
            }
            if (operator === '_between') {
                let value = compareValue;
                if (typeof value === 'string')
                    value = value.split(',');
                dbQuery[logical].whereBetween(key, value);
            }
            if (operator === '_nbetween') {
                let value = compareValue;
                if (typeof value === 'string')
                    value = value.split(',');
                dbQuery[logical].whereNotBetween(key, value);
            }
        }
        function getWhereColumn(path, collection) {
            path = lodash_1.clone(path);
            return followRelation(path);
            function followRelation(pathParts, parentCollection = collection, parentAlias) {
                const relation = relations.find((relation) => {
                    return ((relation.many_collection === parentCollection && relation.many_field === pathParts[0]) ||
                        (relation.one_collection === parentCollection && relation.one_field === pathParts[0]));
                });
                if (!relation)
                    return;
                const isM2O = relation.many_collection === parentCollection && relation.many_field === pathParts[0];
                const alias = lodash_1.get(aliasMap, parentAlias ? [parentAlias, ...pathParts] : pathParts);
                const remainingParts = pathParts.slice(1);
                const parent = isM2O ? relation.one_collection : relation.many_collection;
                if (remainingParts.length === 1) {
                    return `${alias || parent}.${remainingParts[0]}`;
                }
                if (remainingParts.length) {
                    return followRelation(remainingParts, parent, alias);
                }
            }
        }
    }
}
exports.applyFilter = applyFilter;
function applySearch(schema, dbQuery, searchQuery, collection) {
    return __awaiter(this, void 0, void 0, function* () {
        const columns = Object.values(schema.tables[collection].columns);
        dbQuery.andWhere(function () {
            columns
                .map((column) => (Object.assign(Object.assign({}, column), { localType: get_local_type_1.default(column) })))
                .forEach((column) => {
                if (['text', 'string'].includes(column.localType)) {
                    this.orWhereRaw(`LOWER(??) LIKE ?`, [
                        `${column.table_name}.${column.column_name}`,
                        `%${searchQuery.toLowerCase()}%`,
                    ]);
                }
                else if (['bigInteger', 'integer', 'decimal', 'float'].includes(column.localType)) {
                    const number = Number(searchQuery);
                    if (!isNaN(number))
                        this.orWhere({ [`${column.table_name}.${column.column_name}`]: number });
                }
                else if (column.localType === 'uuid' && uuid_validate_1.default(searchQuery)) {
                    this.orWhere({ [`${column.table_name}.${column.column_name}`]: searchQuery });
                }
            });
        });
    });
}
exports.applySearch = applySearch;
function getFilterPath(key, value) {
    const path = [key];
    if (typeof Object.keys(value)[0] === 'string' && Object.keys(value)[0].startsWith('_') === true) {
        return path;
    }
    if (lodash_1.isPlainObject(value)) {
        path.push(...getFilterPath(Object.keys(value)[0], Object.values(value)[0]));
    }
    return path;
}
function getOperation(key, value) {
    if (key.startsWith('_') && key !== '_and' && key !== '_or') {
        return { operator: key, value };
    }
    else if (lodash_1.isPlainObject(value) === false) {
        return { operator: '_eq', value };
    }
    return getOperation(Object.keys(value)[0], Object.values(value)[0]);
}
