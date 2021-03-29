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
exports.down = exports.up = void 0;
const lodash_1 = require("lodash");
function up(knex) {
    return __awaiter(this, void 0, void 0, function* () {
        yield knex('directus_relations')
            .delete()
            .where('many_collection', 'like', 'directus_%')
            .andWhere('one_collection', 'like', 'directus_%');
    });
}
exports.up = up;
function down(knex) {
    return __awaiter(this, void 0, void 0, function* () {
        const defaults = {
            many_collection: 'directus_users',
            many_field: null,
            many_primary: null,
            one_collection: null,
            one_field: null,
            one_primary: null,
            junction_field: null,
        };
        const systemRelations = [
            {
                many_collection: 'directus_users',
                many_field: 'role',
                many_primary: 'id',
                one_collection: 'directus_roles',
                one_field: 'users',
                one_primary: 'id',
            },
            {
                many_collection: 'directus_users',
                many_field: 'avatar',
                many_primary: 'id',
                one_collection: 'directus_files',
                one_primary: 'id',
            },
            {
                many_collection: 'directus_revisions',
                many_field: 'activity',
                many_primary: 'id',
                one_collection: 'directus_activity',
                one_field: 'revisions',
                one_primary: 'id',
            },
            {
                many_collection: 'directus_presets',
                many_field: 'user',
                many_primary: 'id',
                one_collection: 'directus_users',
                one_primary: 'id',
            },
            {
                many_collection: 'directus_presets',
                many_field: 'role',
                many_primary: 'id',
                one_collection: 'directus_roles',
                one_primary: 'id',
            },
            {
                many_collection: 'directus_folders',
                many_field: 'parent',
                many_primary: 'id',
                one_collection: 'directus_folders',
                one_primary: 'id',
            },
            {
                many_collection: 'directus_files',
                many_field: 'folder',
                many_primary: 'id',
                one_collection: 'directus_folders',
                one_primary: 'id',
            },
            {
                many_collection: 'directus_files',
                many_field: 'uploaded_by',
                many_primary: 'id',
                one_collection: 'directus_users',
                one_primary: 'id',
            },
            {
                many_collection: 'directus_fields',
                many_field: 'collection',
                many_primary: 'id',
                one_collection: 'directus_collections',
                one_field: 'fields',
                one_primary: 'collection',
            },
            {
                many_collection: 'directus_activity',
                many_field: 'user',
                many_primary: 'id',
                one_collection: 'directus_users',
                one_primary: 'id',
            },
            {
                many_collection: 'directus_settings',
                many_field: 'project_logo',
                many_primary: 'id',
                one_collection: 'directus_files',
                one_primary: 'id',
            },
            {
                many_collection: 'directus_settings',
                many_field: 'public_foreground',
                many_primary: 'id',
                one_collection: 'directus_files',
                one_primary: 'id',
            },
            {
                many_collection: 'directus_settings',
                many_field: 'public_background',
                many_primary: 'id',
                one_collection: 'directus_files',
                one_primary: 'id',
            },
        ].map((row) => {
            for (const [key, value] of Object.entries(row)) {
                if (value !== null && (typeof value === 'object' || Array.isArray(value))) {
                    row[key] = JSON.stringify(value);
                }
            }
            return lodash_1.merge({}, defaults, row);
        });
        yield knex.insert(systemRelations).into('directus_relations');
    });
}
exports.down = down;
