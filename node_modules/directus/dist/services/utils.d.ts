import { AbstractServiceOptions, Accountability, PrimaryKey, SchemaOverview } from '../types';
import { Knex } from 'knex';
export declare class UtilsService {
    knex: Knex;
    accountability: Accountability | null;
    schema: SchemaOverview;
    constructor(options: AbstractServiceOptions);
    sort(collection: string, { item, to }: {
        item: PrimaryKey;
        to: PrimaryKey;
    }): Promise<void>;
}
