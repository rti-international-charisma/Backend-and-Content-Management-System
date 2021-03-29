import { Knex } from 'knex';
/**
 * NOTE:
 * MS SQL doesn't support recursive foreign key constraints, nor having multiple foreign key constraints to the same
 * related table. This means that about half of the above constraint triggers won't be available in MS SQL. To avoid
 * confusion in what's there and what isn't, we'll skip the on-delete / on-update triggers altogether in MS SQL.
 */
export declare function up(knex: Knex): Promise<void>;
export declare function down(knex: Knex): Promise<void>;
