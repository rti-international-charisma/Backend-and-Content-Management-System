import { Knex } from 'knex';
import { Query, Filter, SchemaOverview } from '../types';
export default function applyQuery(collection: string, dbQuery: Knex.QueryBuilder, query: Query, schema: SchemaOverview, subQuery?: boolean): void;
export declare function applyFilter(schema: SchemaOverview, rootQuery: Knex.QueryBuilder, rootFilter: Filter, collection: string, subQuery?: boolean): void;
export declare function applySearch(schema: SchemaOverview, dbQuery: Knex.QueryBuilder, searchQuery: string, collection: string): Promise<void>;
