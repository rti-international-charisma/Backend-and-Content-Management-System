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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelationsService = void 0;
const items_1 = require("./items");
const permissions_1 = require("./permissions");
const to_array_1 = require("../utils/to-array");
const relations_1 = require("../database/system-data/relations");
class RelationsService extends items_1.ItemsService {
    constructor(options) {
        super('directus_relations', options);
        this.permissionsService = new permissions_1.PermissionsService(options);
    }
    readByQuery(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const service = new items_1.ItemsService('directus_relations', {
                knex: this.knex,
                schema: this.schema,
            });
            const results = (yield service.readByQuery(query));
            if (results && Array.isArray(results)) {
                results.push(...relations_1.systemRelationRows);
            }
            const filteredResults = yield this.filterForbidden(results);
            return filteredResults;
        });
    }
    readByKey(key, query = {}, action = 'read') {
        return __awaiter(this, void 0, void 0, function* () {
            const service = new items_1.ItemsService('directus_relations', {
                knex: this.knex,
                schema: this.schema,
            });
            const results = (yield service.readByKey(key, query, action));
            // No need to merge system relations here. They don't have PKs so can never be directly
            // targetted
            const filteredResults = yield this.filterForbidden(results);
            return filteredResults;
        });
    }
    filterForbidden(relations) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (relations === null)
                return null;
            if (this.accountability === null || ((_a = this.accountability) === null || _a === void 0 ? void 0 : _a.admin) === true)
                return relations;
            const allowedCollections = this.schema.permissions
                .filter((permission) => {
                return permission.action === 'read';
            })
                .map(({ collection }) => collection);
            const allowedFields = this.permissionsService.getAllowedFields('read');
            relations = to_array_1.toArray(relations);
            return relations.filter((relation) => {
                let collectionsAllowed = true;
                let fieldsAllowed = true;
                if (allowedCollections.includes(relation.many_collection) === false) {
                    collectionsAllowed = false;
                }
                if (relation.one_collection && allowedCollections.includes(relation.one_collection) === false) {
                    collectionsAllowed = false;
                }
                if (relation.one_allowed_collections &&
                    relation.one_allowed_collections.every((collection) => allowedCollections.includes(collection)) === false) {
                    collectionsAllowed = false;
                }
                if (!allowedFields[relation.many_collection] ||
                    (allowedFields[relation.many_collection].includes('*') === false &&
                        allowedFields[relation.many_collection].includes(relation.many_field) === false)) {
                    fieldsAllowed = false;
                }
                if (relation.one_collection &&
                    relation.one_field &&
                    (!allowedFields[relation.one_collection] ||
                        (allowedFields[relation.one_collection].includes('*') === false &&
                            allowedFields[relation.one_collection].includes(relation.one_field) === false))) {
                    fieldsAllowed = false;
                }
                return collectionsAllowed && fieldsAllowed;
            });
        });
    }
}
exports.RelationsService = RelationsService;
