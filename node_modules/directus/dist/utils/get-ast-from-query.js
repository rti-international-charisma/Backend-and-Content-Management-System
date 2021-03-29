"use strict";
/**
 * Generate an AST based on a given collection and query
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
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const get_relation_type_1 = require("../utils/get-relation-type");
const fields_1 = require("../database/system-data/fields");
const relations_1 = require("../database/system-data/relations");
function getASTFromQuery(collection, query, schema, options) {
    return __awaiter(this, void 0, void 0, function* () {
        query = lodash_1.cloneDeep(query);
        const accountability = options === null || options === void 0 ? void 0 : options.accountability;
        const action = (options === null || options === void 0 ? void 0 : options.action) || 'read';
        const relations = [...schema.relations, ...relations_1.systemRelationRows];
        const permissions = accountability && accountability.admin !== true
            ? schema.permissions.filter((permission) => {
                return permission.action === action;
            })
            : null;
        const ast = {
            type: 'root',
            name: collection,
            query: query,
            children: [],
        };
        const fields = query.fields || ['*'];
        const deep = query.deep || {};
        // Prevent fields/deep from showing up in the query object in further use
        delete query.fields;
        delete query.deep;
        ast.children = yield parseFields(collection, fields, deep);
        return ast;
        function parseFields(parentCollection, fields, deep) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!fields)
                    return [];
                fields = yield convertWildcards(parentCollection, fields);
                if (!fields)
                    return [];
                const children = [];
                const relationalStructure = {};
                for (const field of fields) {
                    const isRelational = field.includes('.') ||
                        // We'll always treat top level o2m fields as a related item. This is an alias field, otherwise it won't return
                        // anything
                        !!relations.find((relation) => relation.one_collection === parentCollection && relation.one_field === field);
                    if (isRelational) {
                        // field is relational
                        const parts = field.split('.');
                        let fieldKey = parts[0];
                        let collectionScope = null;
                        // m2a related collection scoped field selector `fields=sections.section_id:headings.title`
                        if (fieldKey.includes(':')) {
                            const [key, scope] = fieldKey.split(':');
                            fieldKey = key;
                            collectionScope = scope;
                        }
                        if (relationalStructure.hasOwnProperty(fieldKey) === false) {
                            if (collectionScope) {
                                relationalStructure[fieldKey] = { [collectionScope]: [] };
                            }
                            else {
                                relationalStructure[fieldKey] = [];
                            }
                        }
                        if (parts.length > 1) {
                            const childKey = parts.slice(1).join('.');
                            if (collectionScope) {
                                if (collectionScope in relationalStructure[fieldKey] === false) {
                                    relationalStructure[fieldKey][collectionScope] = [];
                                }
                                relationalStructure[fieldKey][collectionScope].push(childKey);
                            }
                            else {
                                relationalStructure[fieldKey].push(childKey);
                            }
                        }
                    }
                    else {
                        children.push({ type: 'field', name: field });
                    }
                }
                for (const [relationalField, nestedFields] of Object.entries(relationalStructure)) {
                    const relatedCollection = getRelatedCollection(parentCollection, relationalField);
                    const relation = getRelation(parentCollection, relationalField);
                    if (!relation)
                        continue;
                    const relationType = get_relation_type_1.getRelationType({
                        relation,
                        collection: parentCollection,
                        field: relationalField,
                    });
                    if (!relationType)
                        continue;
                    let child = null;
                    if (relationType === 'm2a') {
                        const allowedCollections = relation.one_allowed_collections.split(',').filter((collection) => {
                            if (!permissions)
                                return true;
                            return permissions.some((permission) => permission.collection === collection);
                        });
                        child = {
                            type: 'm2a',
                            names: allowedCollections,
                            children: {},
                            query: {},
                            relatedKey: {},
                            parentKey: schema.tables[parentCollection].primary,
                            fieldKey: relationalField,
                            relation: relation,
                        };
                        for (const relatedCollection of allowedCollections) {
                            child.children[relatedCollection] = yield parseFields(relatedCollection, Array.isArray(nestedFields) ? nestedFields : nestedFields[relatedCollection] || ['*']);
                            child.query[relatedCollection] = {};
                            child.relatedKey[relatedCollection] = schema.tables[relatedCollection].primary;
                        }
                    }
                    else if (relatedCollection) {
                        if (permissions && permissions.some((permission) => permission.collection === relatedCollection) === false) {
                            continue;
                        }
                        child = {
                            type: relationType,
                            name: relatedCollection,
                            fieldKey: relationalField,
                            parentKey: schema.tables[parentCollection].primary,
                            relatedKey: schema.tables[relatedCollection].primary,
                            relation: relation,
                            query: getDeepQuery((deep === null || deep === void 0 ? void 0 : deep[relationalField]) || {}),
                            children: yield parseFields(relatedCollection, nestedFields, (deep === null || deep === void 0 ? void 0 : deep[relationalField]) || {}),
                        };
                    }
                    if (child) {
                        children.push(child);
                    }
                }
                return children;
            });
        }
        function convertWildcards(parentCollection, fields) {
            var _a;
            return __awaiter(this, void 0, void 0, function* () {
                fields = lodash_1.cloneDeep(fields);
                const fieldsInCollection = yield getFieldsInCollection(parentCollection);
                let allowedFields = fieldsInCollection;
                if (permissions) {
                    const permittedFields = (_a = permissions.find((permission) => parentCollection === permission.collection)) === null || _a === void 0 ? void 0 : _a.fields;
                    if (permittedFields !== undefined)
                        allowedFields = permittedFields;
                }
                if (!allowedFields || allowedFields.length === 0)
                    return [];
                // In case of full read permissions
                if (allowedFields[0] === '*')
                    allowedFields = fieldsInCollection;
                for (let index = 0; index < fields.length; index++) {
                    const fieldKey = fields[index];
                    if (fieldKey.includes('*') === false)
                        continue;
                    if (fieldKey === '*') {
                        // Set to all fields in collection
                        if (allowedFields.includes('*')) {
                            fields.splice(index, 1, ...fieldsInCollection);
                        }
                        else {
                            // Set to all allowed fields
                            fields.splice(index, 1, ...allowedFields);
                        }
                    }
                    // Swap *.* case for *,<relational-field>.*,<another-relational>.*
                    if (fieldKey.includes('.') && fieldKey.split('.')[0] === '*') {
                        const parts = fieldKey.split('.');
                        const relationalFields = allowedFields.includes('*')
                            ? relations
                                .filter((relation) => relation.many_collection === parentCollection || relation.one_collection === parentCollection)
                                .map((relation) => {
                                const isMany = relation.many_collection === parentCollection;
                                return isMany ? relation.many_field : relation.one_field;
                            })
                            : allowedFields.filter((fieldKey) => !!getRelation(parentCollection, fieldKey));
                        const nonRelationalFields = allowedFields.filter((fieldKey) => relationalFields.includes(fieldKey) === false);
                        fields.splice(index, 1, ...[
                            ...relationalFields.map((relationalField) => {
                                return `${relationalField}.${parts.slice(1).join('.')}`;
                            }),
                            ...nonRelationalFields,
                        ]);
                    }
                }
                return fields;
            });
        }
        function getRelation(collection, field) {
            const relation = relations.find((relation) => {
                return ((relation.many_collection === collection && relation.many_field === field) ||
                    (relation.one_collection === collection && relation.one_field === field));
            });
            return relation;
        }
        function getRelatedCollection(collection, field) {
            const relation = getRelation(collection, field);
            if (!relation)
                return null;
            if (relation.many_collection === collection && relation.many_field === field) {
                return relation.one_collection || null;
            }
            if (relation.one_collection === collection && relation.one_field === field) {
                return relation.many_collection || null;
            }
            return null;
        }
        function getFieldsInCollection(collection) {
            return __awaiter(this, void 0, void 0, function* () {
                const columns = Object.keys(schema.tables[collection].columns);
                const fields = [
                    ...schema.fields.filter((field) => field.collection === collection).map((field) => field.field),
                    ...fields_1.systemFieldRows.filter((fieldMeta) => fieldMeta.collection === collection).map((fieldMeta) => fieldMeta.field),
                ];
                const fieldsInCollection = [
                    ...columns,
                    ...fields.filter((field) => {
                        return columns.includes(field) === false;
                    }),
                ];
                return fieldsInCollection;
            });
        }
    });
}
exports.default = getASTFromQuery;
function getDeepQuery(query) {
    return lodash_1.mapKeys(lodash_1.omitBy(query, (value, key) => key.startsWith('_') === false), (value, key) => key.substring(1));
}
