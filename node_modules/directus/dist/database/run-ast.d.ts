import { AST, NestedCollectionNode } from '../types/ast';
import { Item, SchemaOverview } from '../types';
import { Knex } from 'knex';
declare type RunASTOptions = {
    query?: AST['query'];
    knex?: Knex;
    nested?: boolean;
    stripNonRequested?: boolean;
};
export default function runAST(originalAST: AST | NestedCollectionNode, schema: SchemaOverview, options?: RunASTOptions): Promise<null | Item | Item[]>;
export {};
