/**
 * Process a given payload for a collection to ensure the special fields (hash, uuid, date etc) are
 * handled correctly.
 */
import { Item, AbstractServiceOptions, Accountability, PrimaryKey, SchemaOverview } from '../types';
import { Knex } from 'knex';
declare type Action = 'create' | 'read' | 'update';
declare type Transformers = {
    [type: string]: (context: {
        action: Action;
        value: any;
        payload: Partial<Item>;
        accountability: Accountability | null;
    }) => Promise<any>;
};
export declare class PayloadService {
    accountability: Accountability | null;
    knex: Knex;
    collection: string;
    schema: SchemaOverview;
    constructor(collection: string, options: AbstractServiceOptions);
    /**
     * @todo allow this to be extended
     *
     * @todo allow these extended special types to have "field dependencies"?
     * f.e. the file-links transformer needs the id and filename_download to be fetched from the DB
     * in order to work
     */
    transformers: Transformers;
    processValues(action: Action, payloads: Partial<Item>[]): Promise<Partial<Item>[]>;
    processValues(action: Action, payload: Partial<Item>): Promise<Partial<Item>>;
    processField(field: SchemaOverview['fields'][number], payload: Partial<Item>, action: Action, accountability: Accountability | null): Promise<any>;
    /**
     * Knex returns `datetime` and `date` columns as Date.. This is wrong for date / datetime, as those
     * shouldn't return with time / timezone info respectively
     */
    processDates(payloads: Partial<Record<string, any>>[]): Promise<Partial<Record<string, any>>[]>;
    /**
     * Recursively save/update all nested related Any-to-One items
     */
    processA2O(payloads: Partial<Item>[]): Promise<Partial<Item>[]>;
    processA2O(payloads: Partial<Item>): Promise<Partial<Item>>;
    /**
     * Recursively save/update all nested related m2o items
     */
    processM2O(payloads: Partial<Item>[]): Promise<Partial<Item>[]>;
    processM2O(payloads: Partial<Item>): Promise<Partial<Item>>;
    /**
     * Recursively save/update all nested related o2m items
     */
    processO2M(payload: Partial<Item> | Partial<Item>[], parent?: PrimaryKey): Promise<void>;
}
export {};
