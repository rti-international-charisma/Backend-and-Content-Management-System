import { Accountability, PermissionsAction, Item as AnyItem, Query, PrimaryKey, AbstractService, AbstractServiceOptions, SchemaOverview } from '../types';
import { Knex } from 'knex';
export declare class ItemsService<Item extends AnyItem = AnyItem> implements AbstractService {
    collection: string;
    knex: Knex;
    accountability: Accountability | null;
    eventScope: string;
    schema: SchemaOverview;
    constructor(collection: string, options: AbstractServiceOptions);
    create(data: Partial<Item>[]): Promise<PrimaryKey[]>;
    create(data: Partial<Item>): Promise<PrimaryKey>;
    readByQuery(query: Query, opts?: {
        stripNonRequested?: boolean;
    }): Promise<null | Partial<Item> | Partial<Item>[]>;
    readByKey(keys: PrimaryKey[], query?: Query, action?: PermissionsAction): Promise<null | Partial<Item>[]>;
    readByKey(key: PrimaryKey, query?: Query, action?: PermissionsAction): Promise<null | Partial<Item>>;
    update(data: Partial<Item>, keys: PrimaryKey[]): Promise<PrimaryKey[]>;
    update(data: Partial<Item>, key: PrimaryKey): Promise<PrimaryKey>;
    update(data: Partial<Item>[]): Promise<PrimaryKey[]>;
    updateByQuery(data: Partial<Item>, query: Query): Promise<PrimaryKey[]>;
    upsert(data: Partial<Item>[]): Promise<PrimaryKey[]>;
    upsert(data: Partial<Item>): Promise<PrimaryKey>;
    delete(key: PrimaryKey): Promise<PrimaryKey>;
    delete(keys: PrimaryKey[]): Promise<PrimaryKey[]>;
    deleteByQuery(query: Query): Promise<PrimaryKey[]>;
    readSingleton(query: Query, opts?: {
        stripNonRequested?: boolean;
    }): Promise<Partial<Item>>;
    upsertSingleton(data: Partial<Item>): Promise<PrimaryKey | PrimaryKey[]>;
}
