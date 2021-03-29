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
exports.PermissionsService = void 0;
const items_1 = require("../services/items");
const filter_items_1 = require("../utils/filter-items");
const app_access_permissions_1 = require("../database/system-data/app-access-permissions");
class PermissionsService extends items_1.ItemsService {
    constructor(options) {
        super('directus_permissions', options);
    }
    getAllowedFields(action, collection) {
        const results = this.schema.permissions.filter((permission) => {
            let matchesCollection = true;
            if (collection) {
                matchesCollection = permission.collection === collection;
            }
            return permission.action === action;
        });
        const fieldsPerCollection = {};
        for (const result of results) {
            const { collection, fields } = result;
            if (!fieldsPerCollection[collection])
                fieldsPerCollection[collection] = [];
            fieldsPerCollection[collection].push(...(fields !== null && fields !== void 0 ? fields : []));
        }
        return fieldsPerCollection;
    }
    readByQuery(query, opts) {
        const _super = Object.create(null, {
            readByQuery: { get: () => super.readByQuery }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield _super.readByQuery.call(this, query, opts);
            if (Array.isArray(result) && this.accountability && this.accountability.app === true) {
                result.push(...filter_items_1.filterItems(app_access_permissions_1.appAccessMinimalPermissions.map((permission) => (Object.assign(Object.assign({}, permission), { role: this.accountability.role }))), query.filter));
            }
            return result;
        });
    }
    readByKey(key, query = {}, action = 'read') {
        const _super = Object.create(null, {
            readByKey: { get: () => super.readByKey }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield _super.readByKey.call(this, key, query, action);
            if (Array.isArray(result) && this.accountability && this.accountability.app === true) {
                result.push(...filter_items_1.filterItems(app_access_permissions_1.appAccessMinimalPermissions.map((permission) => (Object.assign(Object.assign({}, permission), { role: this.accountability.role }))), query.filter));
            }
            return result;
        });
    }
}
exports.PermissionsService = PermissionsService;
