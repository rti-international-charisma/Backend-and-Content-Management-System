/**
 * Generate an AST based on a given collection and query
 */
import { AST, Query, PermissionsAction, Accountability, SchemaOverview } from '../types';
import { Knex } from 'knex';
declare type GetASTOptions = {
    accountability?: Accountability | null;
    action?: PermissionsAction;
    knex?: Knex;
};
export default function getASTFromQuery(collection: string, query: Query, schema: SchemaOverview, options?: GetASTOptions): Promise<AST>;
export {};
