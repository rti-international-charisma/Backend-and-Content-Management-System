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
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        yield knex.schema.alterTable('directus_relations', (table) => {
            table.string('sort_field');
        });
        const fieldsWithSort = yield knex
            .select('collection', 'field', 'options')
            .from('directus_fields')
            .whereIn('interface', ['one-to-many', 'm2a-builder', 'many-to-many']);
        for (const field of fieldsWithSort) {
            const options = typeof field.options === 'string' ? JSON.parse(field.options) : (_a = field.options) !== null && _a !== void 0 ? _a : {};
            if ('sortField' in options) {
                yield knex('directus_relations')
                    .update({
                    sort_field: options.sortField,
                })
                    .where({
                    one_collection: field.collection,
                    one_field: field.field,
                });
            }
        }
    });
}
exports.up = up;
function down(knex) {
    return __awaiter(this, void 0, void 0, function* () {
        yield knex.schema.alterTable('directus_relations', (table) => {
            table.dropColumn('sort_field');
        });
    });
}
exports.down = down;
