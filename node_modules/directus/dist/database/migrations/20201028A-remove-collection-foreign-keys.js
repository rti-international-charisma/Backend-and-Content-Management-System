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
function up(knex) {
    return __awaiter(this, void 0, void 0, function* () {
        yield knex.schema.alterTable('directus_fields', (table) => {
            table.dropForeign(['collection']);
        });
        yield knex.schema.alterTable('directus_activity', (table) => {
            table.dropForeign(['collection']);
        });
        yield knex.schema.alterTable('directus_permissions', (table) => {
            table.dropForeign(['collection']);
        });
        yield knex.schema.alterTable('directus_presets', (table) => {
            table.dropForeign(['collection']);
        });
        yield knex.schema.alterTable('directus_relations', (table) => {
            table.dropForeign(['one_collection']);
            table.dropForeign(['many_collection']);
        });
        yield knex.schema.alterTable('directus_revisions', (table) => {
            table.dropForeign(['collection']);
        });
    });
}
exports.up = up;
function down(knex) {
    return __awaiter(this, void 0, void 0, function* () {
        yield knex.schema.alterTable('directus_fields', (table) => {
            table.foreign('collection').references('directus_collections.collection');
        });
        yield knex.schema.alterTable('directus_activity', (table) => {
            table.foreign('collection').references('directus_collections.collection');
        });
        yield knex.schema.alterTable('directus_permissions', (table) => {
            table.foreign('collection').references('directus_collections.collection');
        });
        yield knex.schema.alterTable('directus_presets', (table) => {
            table.foreign('collection').references('directus_collections.collection');
        });
        yield knex.schema.alterTable('directus_relations', (table) => {
            table.foreign('one_collection').references('directus_collections.collection');
            table.foreign('many_collection').references('directus_collections.collection');
        });
        yield knex.schema.alterTable('directus_revisions', (table) => {
            table.foreign('collection').references('directus_collections.collection');
        });
    });
}
exports.down = down;
