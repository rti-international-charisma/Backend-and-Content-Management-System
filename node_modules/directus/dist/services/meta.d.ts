import { Query } from '../types/query';
import { AbstractServiceOptions, Accountability, SchemaOverview } from '../types';
import { Knex } from 'knex';
export declare class MetaService {
    knex: Knex;
    accountability: Accountability | null;
    schema: SchemaOverview;
    constructor(options: AbstractServiceOptions);
    getMetaForQuery(collection: string, query: Query): Promise<{
        [x: string]: any;
    } | undefined>;
    totalCount(collection: string): Promise<number>;
    filterCount(collection: string, query: Query): Promise<number>;
}
