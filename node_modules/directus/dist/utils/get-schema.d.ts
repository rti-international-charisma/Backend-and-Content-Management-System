import { Accountability, SchemaOverview } from '../types';
import { Knex } from 'knex';
export declare function getSchema(options?: {
    accountability?: Accountability;
    database?: Knex;
}): Promise<SchemaOverview>;
