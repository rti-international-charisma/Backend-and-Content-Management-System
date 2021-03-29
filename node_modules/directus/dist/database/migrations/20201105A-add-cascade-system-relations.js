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
const updates = [
    {
        table: 'directus_fields',
        constraints: [
            {
                column: 'group',
                references: 'directus_fields.id',
                onDelete: 'SET NULL',
            },
        ],
    },
    {
        table: 'directus_files',
        constraints: [
            {
                column: 'folder',
                references: 'directus_folders.id',
                onDelete: 'SET NULL',
            },
            {
                column: 'uploaded_by',
                references: 'directus_users.id',
                onDelete: 'SET NULL',
            },
            {
                column: 'modified_by',
                references: 'directus_users.id',
                onDelete: 'SET NULL',
            },
        ],
    },
    {
        table: 'directus_folders',
        constraints: [
            {
                column: 'parent',
                references: 'directus_folders.id',
                onDelete: 'CASCADE',
            },
        ],
    },
    {
        table: 'directus_permissions',
        constraints: [
            {
                column: 'role',
                references: 'directus_roles.id',
                onDelete: 'CASCADE',
            },
        ],
    },
    {
        table: 'directus_presets',
        constraints: [
            {
                column: 'user',
                references: 'directus_users.id',
                onDelete: 'CASCADE',
            },
            {
                column: 'role',
                references: 'directus_roles.id',
                onDelete: 'CASCADE',
            },
        ],
    },
    {
        table: 'directus_revisions',
        constraints: [
            {
                column: 'activity',
                references: 'directus_activity.id',
                onDelete: 'CASCADE',
            },
            {
                column: 'parent',
                references: 'directus_revisions.id',
                onDelete: 'SET NULL',
            },
        ],
    },
    {
        table: 'directus_sessions',
        constraints: [
            {
                column: 'user',
                references: 'directus_users.id',
                onDelete: 'CASCADE',
            },
        ],
    },
    {
        table: 'directus_settings',
        constraints: [
            {
                column: 'project_logo',
                references: 'directus_files.id',
                onDelete: 'SET NULL',
            },
            {
                column: 'public_foreground',
                references: 'directus_files.id',
                onDelete: 'SET NULL',
            },
            {
                column: 'public_background',
                references: 'directus_files.id',
                onDelete: 'SET NULL',
            },
        ],
    },
    {
        table: 'directus_users',
        constraints: [
            {
                column: 'role',
                references: 'directus_roles.id',
                onDelete: 'SET NULL',
            },
        ],
    },
];
/**
 * NOTE:
 * MS SQL doesn't support recursive foreign key constraints, nor having multiple foreign key constraints to the same
 * related table. This means that about half of the above constraint triggers won't be available in MS SQL. To avoid
 * confusion in what's there and what isn't, we'll skip the on-delete / on-update triggers altogether in MS SQL.
 */
function up(knex) {
    return __awaiter(this, void 0, void 0, function* () {
        if (knex.client.config.client === 'mssql')
            return;
        for (const update of updates) {
            yield knex.schema.alterTable(update.table, (table) => {
                for (const constraint of update.constraints) {
                    table.dropForeign([constraint.column]);
                    table
                        .foreign(constraint.column)
                        .references(constraint.references)
                        .onUpdate('CASCADE')
                        .onDelete(constraint.onDelete);
                }
            });
        }
    });
}
exports.up = up;
function down(knex) {
    return __awaiter(this, void 0, void 0, function* () {
        if (knex.client.config.client === 'mssql')
            return;
        for (const update of updates) {
            yield knex.schema.alterTable(update.table, (table) => {
                for (const constraint of update.constraints) {
                    table.dropForeign([constraint.column]);
                    table.foreign(constraint.column).references(constraint.references).onUpdate('NO ACTION').onDelete('NO ACTION');
                }
            });
        }
    });
}
exports.down = down;
