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
const lodash_1 = require("lodash");
const index_1 = __importDefault(require("./index"));
const payload_1 = require("../services/payload");
const apply_query_1 = __importDefault(require("../utils/apply-query"));
const to_array_1 = require("../utils/to-array");
function runAST(originalAST, schema, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const ast = lodash_1.cloneDeep(originalAST);
        const knex = (options === null || options === void 0 ? void 0 : options.knex) || index_1.default;
        if (ast.type === 'm2a') {
            const results = {};
            for (const collection of ast.names) {
                results[collection] = yield run(collection, ast.children[collection], ast.query[collection]);
            }
            return results;
        }
        else {
            return yield run(ast.name, ast.children, (options === null || options === void 0 ? void 0 : options.query) || ast.query);
        }
        function run(collection, children, query) {
            return __awaiter(this, void 0, void 0, function* () {
                // Retrieve the database columns to select in the current AST
                const { columnsToSelect, primaryKeyField, nestedCollectionNodes } = yield parseCurrentLevel(collection, children, schema);
                // The actual knex query builder instance. This is a promise that resolves with the raw items from the db
                const dbQuery = yield getDBQuery(knex, collection, columnsToSelect, query, primaryKeyField, schema, options === null || options === void 0 ? void 0 : options.nested);
                const rawItems = yield dbQuery;
                if (!rawItems)
                    return null;
                // Run the items through the special transforms
                const payloadService = new payload_1.PayloadService(collection, { knex, schema });
                let items = yield payloadService.processValues('read', rawItems);
                if (!items || items.length === 0)
                    return items;
                // Apply the `_in` filters to the nested collection batches
                const nestedNodes = applyParentFilters(nestedCollectionNodes, items);
                for (const nestedNode of nestedNodes) {
                    let nestedItems = yield runAST(nestedNode, schema, { knex, nested: true });
                    if (nestedItems) {
                        // Merge all fetched nested records with the parent items
                        items = mergeWithParentItems(nestedItems, items, nestedNode, true);
                    }
                }
                // During the fetching of data, we have to inject a couple of required fields for the child nesting
                // to work (primary / foreign keys) even if they're not explicitly requested. After all fetching
                // and nesting is done, we parse through the output structure, and filter out all non-requested
                // fields
                if ((options === null || options === void 0 ? void 0 : options.nested) !== true && (options === null || options === void 0 ? void 0 : options.stripNonRequested) !== false) {
                    items = removeTemporaryFields(items, originalAST, primaryKeyField);
                }
                return items;
            });
        }
    });
}
exports.default = runAST;
function parseCurrentLevel(collection, children, schema) {
    return __awaiter(this, void 0, void 0, function* () {
        const primaryKeyField = schema.tables[collection].primary;
        const columnsInCollection = Object.keys(schema.tables[collection].columns);
        const columnsToSelectInternal = [];
        const nestedCollectionNodes = [];
        for (const child of children) {
            if (child.type === 'field') {
                if (columnsInCollection.includes(child.name) || child.name === '*') {
                    columnsToSelectInternal.push(child.name);
                }
                continue;
            }
            if (!child.relation)
                continue;
            if (child.type === 'm2o') {
                columnsToSelectInternal.push(child.relation.many_field);
            }
            if (child.type === 'm2a') {
                columnsToSelectInternal.push(child.relation.many_field);
                columnsToSelectInternal.push(child.relation.one_collection_field);
            }
            nestedCollectionNodes.push(child);
        }
        /** Always fetch primary key in case there's a nested relation that needs it */
        if (columnsToSelectInternal.includes(primaryKeyField) === false) {
            columnsToSelectInternal.push(primaryKeyField);
        }
        /** Make sure select list has unique values */
        const columnsToSelect = [...new Set(columnsToSelectInternal)];
        return { columnsToSelect, nestedCollectionNodes, primaryKeyField };
    });
}
function getDBQuery(knex, table, columns, query, primaryKeyField, schema, nested) {
    let dbQuery = knex.select(columns.map((column) => `${table}.${column}`)).from(table);
    const queryCopy = lodash_1.clone(query);
    queryCopy.limit = typeof queryCopy.limit === 'number' ? queryCopy.limit : 100;
    // Nested collection sets are retrieved as a batch request (select w/ a filter)
    // "in", so we shouldn't limit that query, as it's a single request for all
    // nested items, instead of a query per row
    if (queryCopy.limit === -1 || nested) {
        delete queryCopy.limit;
    }
    query.sort = query.sort || [{ column: primaryKeyField, order: 'asc' }];
    apply_query_1.default(table, dbQuery, queryCopy, schema);
    return dbQuery;
}
function applyParentFilters(nestedCollectionNodes, parentItem) {
    const parentItems = to_array_1.toArray(parentItem);
    for (const nestedNode of nestedCollectionNodes) {
        if (!nestedNode.relation)
            continue;
        if (nestedNode.type === 'm2o') {
            nestedNode.query = Object.assign(Object.assign({}, nestedNode.query), { filter: Object.assign(Object.assign({}, (nestedNode.query.filter || {})), { [nestedNode.relation.one_primary]: {
                        _in: lodash_1.uniq(parentItems.map((res) => res[nestedNode.relation.many_field])).filter((id) => id),
                    } }) });
        }
        else if (nestedNode.type === 'o2m') {
            const relatedM2OisFetched = !!nestedNode.children.find((child) => {
                return child.type === 'field' && child.name === nestedNode.relation.many_field;
            });
            if (relatedM2OisFetched === false) {
                nestedNode.children.push({ type: 'field', name: nestedNode.relation.many_field });
            }
            nestedNode.query = Object.assign(Object.assign({}, nestedNode.query), { filter: Object.assign(Object.assign({}, (nestedNode.query.filter || {})), { [nestedNode.relation.many_field]: {
                        _in: lodash_1.uniq(parentItems.map((res) => res[nestedNode.parentKey])).filter((id) => id),
                    } }) });
        }
        else if (nestedNode.type === 'm2a') {
            const keysPerCollection = {};
            for (const parentItem of parentItems) {
                const collection = parentItem[nestedNode.relation.one_collection_field];
                if (!keysPerCollection[collection])
                    keysPerCollection[collection] = [];
                keysPerCollection[collection].push(parentItem[nestedNode.relation.many_field]);
            }
            for (const relatedCollection of nestedNode.names) {
                nestedNode.query[relatedCollection] = Object.assign(Object.assign({}, nestedNode.query[relatedCollection]), { filter: {
                        _and: [
                            nestedNode.query[relatedCollection].filter,
                            {
                                [nestedNode.relatedKey[relatedCollection]]: {
                                    _in: lodash_1.uniq(keysPerCollection[relatedCollection]),
                                },
                            },
                        ].filter((f) => f),
                    } });
            }
        }
    }
    return nestedCollectionNodes;
}
function mergeWithParentItems(nestedItem, parentItem, nestedNode, nested) {
    var _a;
    const nestedItems = to_array_1.toArray(nestedItem);
    const parentItems = lodash_1.clone(to_array_1.toArray(parentItem));
    if (nestedNode.type === 'm2o') {
        for (const parentItem of parentItems) {
            const itemChild = nestedItems.find((nestedItem) => {
                return nestedItem[nestedNode.relation.one_primary] == parentItem[nestedNode.fieldKey];
            });
            parentItem[nestedNode.fieldKey] = itemChild || null;
        }
    }
    else if (nestedNode.type === 'o2m') {
        for (const parentItem of parentItems) {
            let itemChildren = nestedItems.filter((nestedItem) => {
                var _a;
                if (nestedItem === null)
                    return false;
                if (Array.isArray(nestedItem[nestedNode.relation.many_field]))
                    return true;
                return (nestedItem[nestedNode.relation.many_field] == parentItem[nestedNode.relation.one_primary] ||
                    ((_a = nestedItem[nestedNode.relation.many_field]) === null || _a === void 0 ? void 0 : _a[nestedNode.relation.one_primary]) ==
                        parentItem[nestedNode.relation.one_primary]);
            });
            // We re-apply the requested limit here. This forces the _n_ nested items per parent concept
            if (nested) {
                itemChildren = itemChildren.slice(0, (_a = nestedNode.query.limit) !== null && _a !== void 0 ? _a : 100);
            }
            parentItem[nestedNode.fieldKey] = itemChildren.length > 0 ? itemChildren : [];
        }
    }
    else if (nestedNode.type === 'm2a') {
        for (const parentItem of parentItems) {
            if (!nestedNode.relation.one_collection_field) {
                parentItem[nestedNode.fieldKey] = null;
                continue;
            }
            const relatedCollection = parentItem[nestedNode.relation.one_collection_field];
            if (!nestedItem[relatedCollection]) {
                parentItem[nestedNode.fieldKey] = null;
                continue;
            }
            const itemChild = nestedItem[relatedCollection].find((nestedItem) => {
                return nestedItem[nestedNode.relatedKey[relatedCollection]] == parentItem[nestedNode.fieldKey];
            });
            parentItem[nestedNode.fieldKey] = itemChild || null;
        }
    }
    return Array.isArray(parentItem) ? parentItems : parentItems[0];
}
function removeTemporaryFields(rawItem, ast, primaryKeyField, parentItem) {
    const rawItems = lodash_1.cloneDeep(to_array_1.toArray(rawItem));
    const items = [];
    if (ast.type === 'm2a') {
        const fields = {};
        const nestedCollectionNodes = {};
        for (const relatedCollection of ast.names) {
            if (!fields[relatedCollection])
                fields[relatedCollection] = [];
            if (!nestedCollectionNodes[relatedCollection])
                nestedCollectionNodes[relatedCollection] = [];
            for (const child of ast.children[relatedCollection]) {
                if (child.type === 'field') {
                    fields[relatedCollection].push(child.name);
                }
                else {
                    fields[relatedCollection].push(child.fieldKey);
                    nestedCollectionNodes[relatedCollection].push(child);
                }
            }
        }
        for (const rawItem of rawItems) {
            const relatedCollection = parentItem === null || parentItem === void 0 ? void 0 : parentItem[ast.relation.one_collection_field];
            if (rawItem === null || rawItem === undefined)
                return rawItem;
            let item = rawItem;
            for (const nestedNode of nestedCollectionNodes[relatedCollection]) {
                item[nestedNode.fieldKey] = removeTemporaryFields(item[nestedNode.fieldKey], nestedNode, nestedNode.relation.many_primary, item);
            }
            item = fields[relatedCollection].length > 0 ? lodash_1.pick(rawItem, fields[relatedCollection]) : rawItem[primaryKeyField];
            items.push(item);
        }
    }
    else {
        const fields = [];
        const nestedCollectionNodes = [];
        for (const child of ast.children) {
            if (child.type === 'field') {
                fields.push(child.name);
            }
            else {
                fields.push(child.fieldKey);
                nestedCollectionNodes.push(child);
            }
        }
        for (const rawItem of rawItems) {
            if (rawItem === null || rawItem === undefined)
                return rawItem;
            let item = rawItem;
            for (const nestedNode of nestedCollectionNodes) {
                item[nestedNode.fieldKey] = removeTemporaryFields(item[nestedNode.fieldKey], nestedNode, nestedNode.type === 'm2o' ? nestedNode.relation.one_primary : nestedNode.relation.many_primary, item);
            }
            item = fields.length > 0 ? lodash_1.pick(rawItem, fields) : rawItem[primaryKeyField];
            items.push(item);
        }
    }
    return Array.isArray(rawItem) ? items : items[0];
}
